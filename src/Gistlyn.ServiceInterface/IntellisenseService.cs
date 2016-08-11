using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Gistlyn.ServiceModel.Types;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Options;
using Microsoft.CodeAnalysis.Recommendations;
using ServiceStack;
using ServiceStack.OrmLite;
using ServiceStack.Text;

namespace Gistlyn.ServiceInterface
{
    public class IntellisenseService : Service
    {
        public object Any(GetScriptIntellisense request)
        {
            // request.References.Select(x => x.Name).ToArray()
            var suggestions = GetSuggestions(request.MainSource, request.Position);
            return new GetScriptIntellisenseResponse
            {
                Suggestions = suggestions.ToList()
            };
        }

        private static Lazy<MetadataReference[]> builtInLibs = new Lazy<MetadataReference[]>(
         delegate
         {
             Assembly[] assemblies = AppDomain.CurrentDomain.GetAssemblies().Where(x => x.IsDynamic == false).ToArray();
             return assemblies.Select(a =>
             {
                 return MetadataReference.CreateFromFile(a.Location, documentation: DocumentationProvider.Default);
             }).ToArray();
         });

        //mscorlib, systemCore
        public static string[] defaultRefs = new string[]
        {
                    typeof(object).Assembly.Location,                    // mscorlib.dll
                    typeof(Uri).Assembly.Location,                       // System.dll
                    typeof(System.Linq.Enumerable).Assembly.Location,    // System.Core.dll
                    typeof(System.Xml.XmlDocument).Assembly.Location    // System.Xml.dll
        };

        public static string[] GetSuggestions(string code, int position)
        {
            try
            {
                var tree = SyntaxFactory.ParseSyntaxTree(code);
                var compilation = CSharpCompilation.Create("MyCompilation")
                    .AddReferences(builtInLibs.Value)
                    .AddSyntaxTrees(tree);
                var model = compilation.GetSemanticModel(tree);

                var recommendedTask = Recommender.GetRecommendedSymbolsAtPositionAsync(model, position, new AdhocWorkspace());
                recommendedTask.ConfigureAwait(false);
                recommendedTask.Wait(2000);
                var symbols = recommendedTask.Result;

                var results = string.Join("\n", symbols
                    .OrderByDescending(symbol => symbol.Kind)
                    .Select(symbol => symbol.ToMinimalDisplayString(model, position))
                    .OrderBy(result => result));

                return results.Split('\n');
            }
            catch (Exception e)
            {

            } //failed, no need to report, as auto-completion is expected to fail sometimes 
            return new string[0];
        }
    }

    [Route("/scripts/{ScriptId}/suggest")]
    public class GetScriptIntellisense : IReturn<GetScriptIntellisenseResponse>
    {
        public string ScriptId { get; set; }

        public string MainSource { get; set; }

        public int Position { get; set; }

        public List<string> Sources { get; set; }

        public string PackagesConfig { get; set; }

        public List<AssemblyReference> References { get; set; }
    }

    public class GetScriptIntellisenseResponse
    {
        public List<string> Suggestions { get; set; }
    }
}
