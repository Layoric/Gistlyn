﻿/// <reference path='../typings/index.d.ts'/>

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { reduxify, getSortedFileNames } from './utils';
import { store, StateKey, GistCacheKey } from './state';
import { queryString, JsonServiceClient, ServerEventsClient, ISseConnect, splitOnLast, humanize } from './servicestack-client';
import { JsonViewer } from './json-viewer';

import CodeMirror from 'react-codemirror';
import "jspm_packages/npm/codemirror@5.16.0/addon/edit/matchbrackets.js";
import "jspm_packages/npm/codemirror@5.16.0/addon/comment/continuecomment.js";
import "jspm_packages/npm/codemirror@5.16.0/addon/display/fullscreen.js";
import "jspm_packages/npm/codemirror@5.16.0/mode/clike/clike.js";
import "jspm_packages/npm/codemirror@5.16.0/mode/xml/xml.js";
import "./codemirror.js";

import {
    RunScript,
    GetScriptVariables, VariableInfo,
    CancelScript,
    EvaluateExpression,
    ScriptExecutionResult, ScriptStatus
} from './Gistlyn.dtos';

var options = {
    lineNumbers: true,
    matchBrackets: true,
    indentUnit: 4,
    mode: "text/x-csharp",
    extraKeys: {
        "F11" (cm) {
            cm.setOption("fullScreen", !cm.getOption("fullScreen"));
        },
        "Esc" (cm) {
            if (cm.getOption("fullScreen"))
                cm.setOption("fullScreen", false);
        }
    }
};

const ScriptStatusRunning = ["Started", "PrepareToRun", "Running"];
const ScriptStatusError = ["Cancelled", "CompiledWithErrors", "ThrowedException"];

var client = new JsonServiceClient("/");
var sse = new ServerEventsClient("/", ["gist"], {
    handlers: {
        onConnect(activeSub: ISseConnect) {
            store.dispatch({ type: 'SSE_CONNECT', activeSub });
        },
        ConsoleMessage(m, e) {
            store.dispatch({ type: 'CONSOLE_LOG', logs: [{msg:m.message}] });
        },
        ScriptExecutionResult(m:ScriptExecutionResult, e) {
            if (m.status === store.getState().scriptStatus) return;

            const cls = ScriptStatusError.indexOf(m.status) >= 0 ? "error" : "";
            store.dispatch({ type: 'CONSOLE_LOG', logs: [{ msg: humanize(m.status), cls }] });
            store.dispatch({ type: 'SCRIPT_STATUS', scriptStatus: m.status });

            if (m.status === "CompiledWithErrors" && m.errors) {
                const errorMsgs = m.errors.map(e => ({ msg:e.info, cls:"error"}));
                store.dispatch({ type: 'CONSOLE_LOG', logs: errorMsgs });
            }
            else if (m.status === "Completed") {
                var request = new GetScriptVariables();
                request.scriptId = store.getState().activeSub.id;
                client.get(request)
                    .then(r => {
                        store.dispatch({ type: "VARS_LOAD", variables: r.variables });
                    });
            }
        }
    }
});

@reduxify(
    (state) => ({
        gist: state.gist,
        hasLoaded: state.hasLoaded,
        activeSub: state.activeSub,
        meta: state.meta,
        files: state.files,
        activeFileName: state.activeFileName,
        logs: state.logs,
        variables: state.variables,
        inspectedVariables: state.inspectedVariables,
        expression: state.expression,
        expressionResult: state.expressionResult,
        error: state.error,
        scriptStatus: state.scriptStatus
    }),
    (dispatch) => ({
        updateGist: (gist, reload=false) => dispatch({ type: 'GIST_CHANGE', gist, reload }),
        updateSource: (fileName, content) => dispatch({ type: 'SOURCE_CHANGE', fileName, content }),
        selectFileName: (activeFileName) => dispatch({ type: 'FILE_SELECT', activeFileName }),
        raiseError: (error) => dispatch({ type: 'ERROR_RAISE', error }),
        clearError: () => dispatch({ type: 'ERROR_CLEAR' }),
        clearConsole: () => dispatch({ type: 'CONSOLE_CLEAR' }),
        logConsole: (logs) => dispatch({ type:'CONSOLE_LOG', logs }),
        logConsoleError: (status) => dispatch({ type:'CONSOLE_LOG', logs:[Object.assign({ msg:status.message, cls:"error"}, status)] }),
        logConsoleMsgs: (txtMessages) => dispatch({ type:'CONSOLE_LOG', logs:txtMessages.map(msg => ({ msg })) }),
        setScriptStatus: (scriptStatus) => dispatch({ type:'SCRIPT_STATUS', scriptStatus }),
        inspectVariable: (name, variables) => dispatch({ type:'VARS_INSPECT', name, variables }),
        setExpression: (expression) => dispatch({ type: 'EXPRESSION_SET', expression }),
        setExpressionResult: (expressionResult) => dispatch({ type: 'EXPRESSION_LOAD', expressionResult })
    })
)
class App extends React.Component<any, any> {

    getFile(fileName: string): any {
        if (this.props.files == null)
            return null;
        for (let k in this.props.files) {
            if (k.toLowerCase() === fileName) {
                return this.props.files[k];
            }
        }
        return null;
    }

    getFileContents(fileName:string):string {
        const file = this.getFile(fileName);
        return file != null
            ? file.content
            : null;
    }

    getMainFile() {
        return this.getFile("main.cs");
    }

    get scriptId(): string {
        return this.props.activeSub && this.props.activeSub.id;
    }

    run = () => {
        this.props.clearError();
        var request = new RunScript();
        request.scriptId = this.scriptId;
        request.mainSource = this.getMainFile().content;
        request.packagesConfig = this.getFileContents("packages.config");
        request.sources = [];
        for (var k in this.props.files || []) {
            if (k.endsWith(".cs") && k.toLowerCase() !== "main.cs")
                request.sources.push(this.props.files[k].content);
        }

        this.props.setScriptStatus("Started");

        client.post(request)
            .then(r => {
                this.props.logConsoleMsgs(r.references.map(ref => `loaded ${ref.name}`));
            })
            .catch(r => {
                this.props.raiseError(r.responseStatus);
                this.props.setScriptStatus("Failed");
            });
    }

    cancel = () => {
        this.props.clearError();
        const request = new CancelScript();
        request.scriptId = this.scriptId;
        client.post(request)
            .then(r => {
                this.props.setScriptStatus("Cancelled");
                this.props.logConsole([{ msg: "Cancelled by user", cls: "error" }]);
            })
            .catch(r => {
                this.props.raiseError(r.responseStatus);
                this.props.setScriptStatus("Failed");
            });
    }

    handleGistUpdate(e: React.FormEvent) {
        const target = e.target as HTMLInputElement;
        const parts = splitOnLast(target.value, '/');
        const hash = parts[parts.length - 1];
        this.props.updateGist(hash);
    }

    updateSource(src: string) {
        this.props.updateSource(this.props.activeFileName, src);
    }

    inspectVariable(v: VariableInfo) {
        const request = new GetScriptVariables();
        request.scriptId = this.scriptId;
        request.variableName = v.name;

        client.get(request)
            .then(r => {
                if (r.status !== "Completed") {
                    const msg = r.status === "Unknown"
                        ? "Script no longer exists on server"
                        : `Script Error: ${humanize(r.status)}`;
                    this.props.logConsole([{ msg, cls: "error" }]);
                } else {
                    this.props.inspectVariable(v.name, r.variables);
                }
            });
    }

    getVariableRows(v: VariableInfo) {
        var varProps = this.props.inspectedVariables[v.name] as VariableInfo[];
        var rows = [(
            <tr>
                <td className="name" style={{whiteSpace:"nowrap"}}>
                    {v.isBrowseable
                        ? (varProps 
                            ? <span className="octicon octicon-triangle-down" style={{ margin: "0 10px 0 0" }} onClick={e => this.props.inspectVariable(v.name, null)}></span>
                            : <span className="octicon octicon-triangle-right" style={{ margin: "0 10px 0 0" }} onClick={e => this.inspectVariable(v)}></span>)
                        : <span className="octicon octicon-triangle-right" style={{ margin: "0 10px 0 0", color: "#f7f7f7" }}></span>}
                    <a onClick={e => this.setAndEvaluateExpression(v.name)}>{v.name}</a>
                </td>
                <td className="value">{v.value}</td>
                <td className="type">{v.type}</td>
            </tr>
        )];

        if (varProps) {
            varProps.forEach(p => {
                rows.push((
                    <tr>
                        <td className="name" style={{ padding: "0 0 0 50px" }}>
                            {p.canInspect
                                ? <a onClick={e => this.setAndEvaluateExpression(v.name + (p.name[0] != "[" ? "." : "") + p.name) }>{p.name}</a>
                                : <span style={{color:"#999"}}>{p.name}</span>}
                        </td>
                        <td className="value">{p.value}</td>
                        <td className="type">{p.type}</td>
                    </tr>
                ));
            });
        }

        return rows;
    }

    setAndEvaluateExpression(expr: string) {
        this.props.setExpression(expr);
        this.evaluateExpression(expr);
    }

    evaluateExpression(expr: string) {
        if (!expr) {
            this.props.setExpression(expr);
            return;
        }

        const request = new EvaluateExpression();
        request.scriptId = this.scriptId;
        request.expression = expr;
        request.includeJson = true;

        client.post(request)
            .then(r => {
                if (r.result.errors && r.result.errors.length > 0) {
                    r.result.errors.forEach(x => {
                        this.props.logConsole({ msg: x.info, cls:"error" });
                    });
                } else {
                    this.props.setExpressionResult(r.result);
                }
            })
            .catch(e => {
                this.props.logConsoleError(e.responseStatus || e); //both have schema `{ message }`
            });
    }

    revertGist(clearAll:boolean=false) {
        localStorage.removeItem(GistCacheKey(this.props.gist));
        if (clearAll) {
            localStorage.removeItem(StateKey);
        }
        this.props.updateGist(this.props.gist, true);
    }

    consoleScroll: HTMLDivElement;
    filesList: HTMLDivElement;
    lastDialog: HTMLDivElement;

    componentDidUpdate() {
        if (!this.consoleScroll) return;
        this.consoleScroll.scrollTop = this.consoleScroll.scrollHeight;
        window.onkeydown = this.handleWindowKeyDown.bind(this);
    }

    showDialog(e: React.MouseEvent, el: HTMLDivElement) {
        if (el === this.lastDialog) return;
        e.stopPropagation();
        this.lastDialog = el;
        el.style.display = "block";
    }

    handleBodyClick(e:React.MouseEvent) {
        if (this.lastDialog != null) {
            this.lastDialog.style.display = "none";
            this.lastDialog = null;
        }
    }

    handleWindowKeyDown(e: KeyboardEvent) {
        const target = e.target as Element;
        if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;

        if (e.ctrlKey && (e.keyCode === 37 || e.keyCode === 39)) { //ctrl + left/right
            if (!this.props.files || this.props.files.length === 0) return;
            e.stopPropagation();
            const keys = getSortedFileNames(this.props.files);
            const activeIndex = Math.max(0, keys.indexOf(this.props.activeFileName));
            let nextFileIndex = activeIndex + (e.keyCode === 37 ? -1 : 1);
            nextFileIndex = nextFileIndex < 0
                ? keys.length - 1
                : nextFileIndex % keys.length;
            this.props.selectFileName(keys[nextFileIndex]);
        }
    }

    render() {

        let source = "";
        const Tabs = [];
        const FileList = [];

        if (this.props.files) {
            var keys = getSortedFileNames(this.props.files);

            keys.forEach((k) => {
                const file = this.props.files[k];
                const active = k === this.props.activeFileName ||
                    (this.props.activeFileName == null && k.toLowerCase() === "main.cs");

                Tabs.push((
                    <div className={active ? 'active' : null}
                        onClick={e => this.props.selectFileName(file.filename) }
                        ><b>
                            {file.filename}
                        </b></div>
                ));

                FileList.push((
                    <div className="file" onClick={e => this.props.selectFileName(file.filename) }>
                        <div>{file.filename}</div>
                    </div>
                ));

                if (active) {
                    source = file.content;
                    options["mode"] = file.filename.endsWith('.config')
                        ? "application/xml"
                        : "text/x-csharp";
                }
            });
        }

        const main = this.getMainFile();
        if (this.props.hasLoaded && this.props.gist && this.props.files && main == null && this.props.error == null) {
            this.props.error = { message: "main.cs is missing" };
        }

        const isScriptRunning = ScriptStatusRunning.indexOf(this.props.scriptStatus) >= 0;

        var Preview = [];

        if (this.props.error != null) {
            var code = this.props.error.errorCode ? `(${this.props.error.errorCode}) ` : ""; 
            Preview.push((
                <div id="errors" className="section">
                    <div style={{ margin: "25px 25px 40px 25px", color: "#a94442" }}>
                        {code}{this.props.error.message}
                    </div>
                    { this.props.error.stackTrace != null
                        ? <pre style={{ color: "red", padding: "5px 30px" }}>{this.props.error.stackTrace}</pre>
                        : null}
                </div>));
        } else if (isScriptRunning) {
            Preview.push((
                <div id="status" className="section">
                    <div style={{ margin: '40px', color:"#444", width: "215px" }} title="executing...">
                        <img src="/img/ajax-loader.gif" style={{float:"right", margin:"5px 0 0 0"}} />
                        <i className="material-icons" style={{ position: "absolute" }}>build</i>
                        <p style={{ padding: "0 0 0 30px", fontSize: "22px" }}>Executing Script</p>
                    </div>
                </div>));
        }
        else if (this.props.variables.length > 0) {
            var vars = this.props.variables as VariableInfo[];
            var exprResult = this.props.expressionResult as ScriptExecutionResult;
            var exprVar = exprResult != null && exprResult.variables.length > 0 ? exprResult.variables[0] : null;
            Preview.push((
                <div id="vars" className="section">
                    <table style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th className="name">name</th>
                                <th className="value">value</th>
                                <th className="type">type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vars.map(v => this.getVariableRows(v))}
                        </tbody>
                    </table>
                    <div id="evaluate">
                        <input type="text" placeholder="Evaluate Expression" value={this.props.expression} 
                            onChange={e => this.props.setExpression((e.target as HTMLInputElement).value)}
                            onKeyPress={e => e.which === 13 ? this.evaluateExpression(this.props.expression) : null }
                            autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
                        <i className="material-icons" title="run" onClick={e => this.evaluateExpression(this.props.expression) }>play_arrow</i>
                        {exprVar
                            ? (
                                <div id="expression-result">
                                    <JsonViewer json={exprVar.json} />
                                </div>
                            )
                            : null}
                    </div>
                </div>));
        } else {
            Preview.push(<div id="placeholder"></div>);
        }

        if (this.props.logs.length > 0) {
            Preview.push((
                <div id="console" className="section" style={{ borderTop: "solid 1px #ddd", borderBottom: "solid 1px #ddd", font: "14px/20px arial", height:"350px" }}>
                    <b style={{ background: "#444", color: "#fff", padding: "1px 8px", position: "absolute", right: "3px", margin:"-22px 0" }}>console</b>
                    <i className="material-icons clear-btn" title="clear console" onClick={e => this.props.clearConsole() }>clear</i>
                    <div className="scroll" style={{overflow:"auto", maxHeight:"350px"}} ref={(el) => this.consoleScroll = el}>
                        <table style={{width:"100%"}}>
                            <tbody style={{font:"13px/18px monospace", color:"#444"}}>
                                {this.props.logs.map(log => (
                                    <tr>
                                        <td style={{ padding: "2px 8px", tabSize:4 }}><pre className={log.cls}>{log.msg}</pre></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>));
        }

        var activeSub = this.props.activeSub as ISseConnect;

        return (
            <div id="body" onClick={e => this.handleBodyClick(e)}>
                <div className="titlebar">
                    <div className="container">
                        <a href="https://servicestack.net" title="servicestack.net" target="_blank"><img id="logo" src="img/logo-32-inverted.png" /></a>
                        <h3>Gistlyn</h3> <sup style={{ padding: "0 0 0 5px", fontSize: "12px", fontStyle: "italic" }}>BETA</sup>
                        <div id="gist">
                            { this.props.meta
                                ? <img src={ this.props.meta.owner_avatar_url } title={this.props.meta.description} style={{ verticalAlign: "middle", margin:"0 8px 2px 0" }} />
                                : null } 
                            <input type="text" id="txtGist" placeholder="gist hash or url" 
                                   value={this.props.gist}
                                   onFocus={e => (e.target as HTMLInputElement).select() }
                                   onChange={e => this.handleGistUpdate(e) } />
                            { main != null
                                ? <i className="material-icons" style={{ color: "#0f9", fontSize: "30px", position:"absolute", margin: "-2px 0 0 7px"}}>check</i>
                                : this.props.error
                                    ? <i className="material-icons" style={{ color: "#ebccd1", fontSize: "30px", position: "absolute", margin:"-2px 0 0 7px" }}>error</i>
                                    : null }
                        </div>
                        { activeSub == null || parseInt(activeSub.userId) < 0
                            ? (
                                <div id="sign-in" style={{ position: "absolute", right: 10 }}>
                                    <a href="/auth/github" style={{ color: "#fff", textDecoration: "none" }}>
                                        <span style={{ whiteSpace: "nowrap", fontSize: 14 }}>sign-in</span>
                                        <span style={{ verticalAlign: "sub", margin: "0 0 0 10px" }} className="mega-octicon octicon-mark-github" title="Sign in with GitHub"></span>
                                    </a>
                                </div>
                            )
                            : (
                                <div id="signed-in" style={{ position: "absolute", right: 10 }}>
                                    <span style={{ whiteSpace: "nowrap", fontSize: 14 }}>{activeSub.displayName}</span>
                                    <img src={activeSub.profileUrl} style={{ verticalAlign: "middle", margin: "0 0 0 8px", borderRadius:"50%" }} />
                                </div>
                            )}
                    </div>
                </div>

                <div id="content">
                    <div id="ide">
                        <div id="editor">
                            <div id="tabs" style={{display: this.props.files ? 'flex' : 'none'}}>
                                {FileList.length > 0
                                    ? <i id="files-menu" className="material-icons" onClick={e => this.showDialog(e, this.filesList) }>arrow_drop_down</i> : null }
                                {Tabs}
                            </div>
                            <div id="files-list" ref={e => this.filesList = e }>
                                {FileList}
                            </div>
                            <CodeMirror value={source} options={options} onChange={src => this.updateSource(src)} />
                        </div>
                        <div id="preview">
                            {Preview}
                        </div>
                    </div>
                </div>

                <div id="footer-spacer"></div>

                <div id="footer">
                    <div id="actions">
                        <div id="revert" onClick={e => this.revertGist(e.shiftKey)}>
                            <i className="material-icons">undo</i>
                            <p>Revert Changes</p>
                        </div>
                    </div>
                </div>

                <div id="run" className={main == null ? "disabled" : ""} onClick={e => !isScriptRunning ? this.run() : this.cancel()}>
                    {main != null
                        ? (!isScriptRunning
                            ? <i className="material-icons" title="run">play_circle_outline</i>
                            : <i className="material-icons" title="cancel script" style={{ color: "#FF5252" }}>cancel</i>)
                        : <i className="material-icons" title="disabled">play_circle_outline</i>}
                </div>
            </div>
        );
    }
}

var stateJson = localStorage.getItem(StateKey);
var state = null;
if (stateJson) {
    try {
        state = JSON.parse(stateJson);
        store.dispatch({ type: 'LOAD', state });
    } catch (e) {
        console.log('ERROR loading state:', e, stateJson);
        localStorage.removeItem(StateKey);
    }
} 

if (!state)
{
    var qsGist = queryString(location.href)["gist"] || "efc71477cee60916ef71d839084d1afd";
    //alt: 6831799881c92434f80e141c8a2699eb
    store.dispatch({ type: 'GIST_CHANGE', gist: qsGist });
}


ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>,
    document.getElementById("app"));
