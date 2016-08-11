/* Options:
Date: 2016-08-10 21:29:38
Version: 4.062
Tip: To override a DTO option, remove "//" prefix before updating
BaseUrl: http://localhost:4000

//GlobalNamespace:
ExportAsTypes: True
//MakePropertiesOptional: True
//AddServiceStackTypes: True
//AddResponseStatus: False
//AddImplicitVersion:
//AddDescriptionAsComments: True
//IncludeTypes:
//ExcludeTypes:
//DefaultImports:
*/
System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var GithubFile, ResponseStatus, AssemblyReference, ScriptExecutionResult, VariableInfo, ResponseError, ErrorInfo, DebugResponse, StoreGistResponse, GetScriptIntellisenseResponse, HelloResponse, RunScriptResponse, ScriptStateVariables, EvaluateExpressionResponse, CancelScriptResponse, AuthenticateResponse, AssignRolesResponse, UnAssignRolesResponse, ConvertSessionToTokenResponse, Debug, GithubProxy, StoreGist, GetScriptIntellisense, Hello, RunScript, GetScriptVariables, EvaluateExpression, CancelScript, FriendlyLinks, Proxy, Authenticate, AssignRoles, UnAssignRoles, ConvertSessionToToken;
    return {
        setters:[],
        execute: function() {
            GithubFile = (function () {
                function GithubFile() {
                }
                return GithubFile;
            }());
            exports_1("GithubFile", GithubFile);
            // @DataContract
            ResponseStatus = (function () {
                function ResponseStatus() {
                }
                return ResponseStatus;
            }());
            exports_1("ResponseStatus", ResponseStatus);
            AssemblyReference = (function () {
                function AssemblyReference() {
                }
                return AssemblyReference;
            }());
            exports_1("AssemblyReference", AssemblyReference);
            ScriptExecutionResult = (function () {
                function ScriptExecutionResult() {
                }
                return ScriptExecutionResult;
            }());
            exports_1("ScriptExecutionResult", ScriptExecutionResult);
            VariableInfo = (function () {
                function VariableInfo() {
                }
                return VariableInfo;
            }());
            exports_1("VariableInfo", VariableInfo);
            // @DataContract
            ResponseError = (function () {
                function ResponseError() {
                }
                return ResponseError;
            }());
            exports_1("ResponseError", ResponseError);
            ErrorInfo = (function () {
                function ErrorInfo() {
                }
                return ErrorInfo;
            }());
            exports_1("ErrorInfo", ErrorInfo);
            DebugResponse = (function () {
                function DebugResponse() {
                }
                return DebugResponse;
            }());
            exports_1("DebugResponse", DebugResponse);
            StoreGistResponse = (function () {
                function StoreGistResponse() {
                }
                return StoreGistResponse;
            }());
            exports_1("StoreGistResponse", StoreGistResponse);
            GetScriptIntellisenseResponse = (function () {
                function GetScriptIntellisenseResponse() {
                }
                return GetScriptIntellisenseResponse;
            }());
            exports_1("GetScriptIntellisenseResponse", GetScriptIntellisenseResponse);
            HelloResponse = (function () {
                function HelloResponse() {
                }
                return HelloResponse;
            }());
            exports_1("HelloResponse", HelloResponse);
            RunScriptResponse = (function () {
                function RunScriptResponse() {
                }
                return RunScriptResponse;
            }());
            exports_1("RunScriptResponse", RunScriptResponse);
            ScriptStateVariables = (function () {
                function ScriptStateVariables() {
                }
                return ScriptStateVariables;
            }());
            exports_1("ScriptStateVariables", ScriptStateVariables);
            EvaluateExpressionResponse = (function () {
                function EvaluateExpressionResponse() {
                }
                return EvaluateExpressionResponse;
            }());
            exports_1("EvaluateExpressionResponse", EvaluateExpressionResponse);
            CancelScriptResponse = (function () {
                function CancelScriptResponse() {
                }
                return CancelScriptResponse;
            }());
            exports_1("CancelScriptResponse", CancelScriptResponse);
            // @DataContract
            AuthenticateResponse = (function () {
                function AuthenticateResponse() {
                }
                return AuthenticateResponse;
            }());
            exports_1("AuthenticateResponse", AuthenticateResponse);
            // @DataContract
            AssignRolesResponse = (function () {
                function AssignRolesResponse() {
                }
                return AssignRolesResponse;
            }());
            exports_1("AssignRolesResponse", AssignRolesResponse);
            // @DataContract
            UnAssignRolesResponse = (function () {
                function UnAssignRolesResponse() {
                }
                return UnAssignRolesResponse;
            }());
            exports_1("UnAssignRolesResponse", UnAssignRolesResponse);
            // @DataContract
            ConvertSessionToTokenResponse = (function () {
                function ConvertSessionToTokenResponse() {
                }
                return ConvertSessionToTokenResponse;
            }());
            exports_1("ConvertSessionToTokenResponse", ConvertSessionToTokenResponse);
            // @Route("/debug")
            Debug = (function () {
                function Debug() {
                }
                Debug.prototype.createResponse = function () { return new DebugResponse(); };
                Debug.prototype.getTypeName = function () { return "Debug"; };
                return Debug;
            }());
            exports_1("Debug", Debug);
            // @Route("/github-proxy/{PathInfo*}")
            GithubProxy = (function () {
                function GithubProxy() {
                }
                GithubProxy.prototype.createResponse = function () { return ""; };
                GithubProxy.prototype.getTypeName = function () { return "GithubProxy"; };
                return GithubProxy;
            }());
            exports_1("GithubProxy", GithubProxy);
            StoreGist = (function () {
                function StoreGist() {
                }
                StoreGist.prototype.createResponse = function () { return new StoreGistResponse(); };
                StoreGist.prototype.getTypeName = function () { return "StoreGist"; };
                return StoreGist;
            }());
            exports_1("StoreGist", StoreGist);
            // @Route("/scripts/{ScriptId}/suggest")
            GetScriptIntellisense = (function () {
                function GetScriptIntellisense() {
                }
                GetScriptIntellisense.prototype.createResponse = function () { return new GetScriptIntellisenseResponse(); };
                GetScriptIntellisense.prototype.getTypeName = function () { return "GetScriptIntellisense"; };
                return GetScriptIntellisense;
            }());
            exports_1("GetScriptIntellisense", GetScriptIntellisense);
            // @Route("/hello/{Name}")
            Hello = (function () {
                function Hello() {
                }
                Hello.prototype.createResponse = function () { return new HelloResponse(); };
                Hello.prototype.getTypeName = function () { return "Hello"; };
                return Hello;
            }());
            exports_1("Hello", Hello);
            // @Route("/scripts/{ScriptId}/run")
            RunScript = (function () {
                function RunScript() {
                }
                RunScript.prototype.createResponse = function () { return new RunScriptResponse(); };
                RunScript.prototype.getTypeName = function () { return "RunScript"; };
                return RunScript;
            }());
            exports_1("RunScript", RunScript);
            // @Route("/scripts/{ScriptId}/vars")
            // @Route("/scripts/{ScriptId}/vars/{VariableName}")
            GetScriptVariables = (function () {
                function GetScriptVariables() {
                }
                GetScriptVariables.prototype.createResponse = function () { return new ScriptStateVariables(); };
                GetScriptVariables.prototype.getTypeName = function () { return "GetScriptVariables"; };
                return GetScriptVariables;
            }());
            exports_1("GetScriptVariables", GetScriptVariables);
            // @Route("/scripts/{ScriptId}/evaluate")
            EvaluateExpression = (function () {
                function EvaluateExpression() {
                }
                EvaluateExpression.prototype.createResponse = function () { return new EvaluateExpressionResponse(); };
                EvaluateExpression.prototype.getTypeName = function () { return "EvaluateExpression"; };
                return EvaluateExpression;
            }());
            exports_1("EvaluateExpression", EvaluateExpression);
            // @Route("/scripts/{ScriptId}/cancel")
            CancelScript = (function () {
                function CancelScript() {
                }
                CancelScript.prototype.createResponse = function () { return new CancelScriptResponse(); };
                CancelScript.prototype.getTypeName = function () { return "CancelScript"; };
                return CancelScript;
            }());
            exports_1("CancelScript", CancelScript);
            // @Route("/{Name}")
            FriendlyLinks = (function () {
                function FriendlyLinks() {
                }
                return FriendlyLinks;
            }());
            exports_1("FriendlyLinks", FriendlyLinks);
            // @Route("/proxy")
            Proxy = (function () {
                function Proxy() {
                }
                Proxy.prototype.createResponse = function () { return ""; };
                Proxy.prototype.getTypeName = function () { return "Proxy"; };
                return Proxy;
            }());
            exports_1("Proxy", Proxy);
            // @Route("/auth")
            // @Route("/auth/{provider}")
            // @Route("/authenticate")
            // @Route("/authenticate/{provider}")
            // @DataContract
            Authenticate = (function () {
                function Authenticate() {
                }
                Authenticate.prototype.createResponse = function () { return new AuthenticateResponse(); };
                Authenticate.prototype.getTypeName = function () { return "Authenticate"; };
                return Authenticate;
            }());
            exports_1("Authenticate", Authenticate);
            // @Route("/assignroles")
            // @DataContract
            AssignRoles = (function () {
                function AssignRoles() {
                }
                AssignRoles.prototype.createResponse = function () { return new AssignRolesResponse(); };
                AssignRoles.prototype.getTypeName = function () { return "AssignRoles"; };
                return AssignRoles;
            }());
            exports_1("AssignRoles", AssignRoles);
            // @Route("/unassignroles")
            // @DataContract
            UnAssignRoles = (function () {
                function UnAssignRoles() {
                }
                UnAssignRoles.prototype.createResponse = function () { return new UnAssignRolesResponse(); };
                UnAssignRoles.prototype.getTypeName = function () { return "UnAssignRoles"; };
                return UnAssignRoles;
            }());
            exports_1("UnAssignRoles", UnAssignRoles);
            // @Route("/session-to-token")
            // @DataContract
            ConvertSessionToToken = (function () {
                function ConvertSessionToToken() {
                }
                ConvertSessionToToken.prototype.createResponse = function () { return new ConvertSessionToTokenResponse(); };
                ConvertSessionToToken.prototype.getTypeName = function () { return "ConvertSessionToToken"; };
                return ConvertSessionToToken;
            }());
            exports_1("ConvertSessionToToken", ConvertSessionToToken);
        }
    }
});
//# sourceMappingURL=Gistlyn.dtos.js.map