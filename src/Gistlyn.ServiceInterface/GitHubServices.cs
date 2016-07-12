﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using Gistlyn.ServiceModel;
using ServiceStack;
using ServiceStack.Auth;

namespace Gistlyn.ServiceInterface
{
    public class GithubGist
    {
        public string Id { get; set; }
        public string Url { get; set; }
        public string Description { get; set; }
        public bool Public { get; set; }
        public GithubGistOnwer Owner { get; set; }
        public Dictionary<string, GithubGistFileRef> Files { get; set; }
        public DateTime Created_At { get; set; }
        public DateTime Updated_At { get; set; }
    }

    public class GithubGistOnwer
    {
        public string Login { get; set; }
        public string Id { get; set; }
        public string Avatar_Url { get; set; }
    }

    public class GithubGistFileRef
    {
        public int Size { get; set; }
        public string Raw_Url { get; set; }
        public string Type { get; set; }
        public string Language { get; set; }
        public bool Truncated { get; set; }
    }

    public class CreateGithubGist
    {
        public string description { get; set; }
        public bool @public { get; set; }
        public Dictionary<string, GithubFile> files { get; set; }
    }

    public class UpdateGithubGist
    {
        public string description { get; set; }
        public Dictionary<string, GithubFile> files { get; set; }
    }

    [Authenticate]
    public class GitHubServices : Service
    {
        public const string GithubApiBaseUrl = "https://api.github.com/";

        //https://developer.github.com/v3/oauth/#scopes
        public void ConfigureWebRequest(HttpWebRequest req, IAuthSession session)
        {
            var githubToken = session.ProviderOAuthAccess.Safe().FirstOrDefault(x =>
                x.Provider == "github");

            if (githubToken == null)
                throw new Exception("Github OAuth Provider tokens not found");

            req.UserAgent = "Gistlyn";
            req.Headers["Authorization"] = "token " + githubToken.AccessTokenSecret;
        }

        public object Any(StoreGist request)
        {
            var session = base.SessionAs<AuthUserSession>();
            var gist = request.Gist;
            if (request.Public)
            {
                var requiresFork = session.UserName != request.OwnerLogin;
                if (requiresFork)
                {
                    var forkResponse = GithubApiBaseUrl.CombineWith("gists", gist, "forks")
                        .PostToUrl("", requestFilter: req => ConfigureWebRequest(req, session))
                        .FromJson<GithubGist>();

                    gist = forkResponse.Id;
                }

                var updateResponse = GithubApiBaseUrl.CombineWith("gists", gist)
                    .PatchJsonToUrl(new UpdateGithubGist
                    {
                        description = request.Description,
                        files = request.Files,
                    }, 
                    requestFilter: req => ConfigureWebRequest(req, session));
            }
            else
            {
                request.Files.Each(f => f.Value.filename = null); //Need to remove when creating gist

                var createResponse = GithubApiBaseUrl.CombineWith("gists")
                    .PostJsonToUrl(new CreateGithubGist {
                        description = request.Description,
                        @public = false,
                        files = request.Files,
                    }, 
                    requestFilter: req => ConfigureWebRequest(req, session))
                    .FromJson<GithubGist>();

                gist = createResponse.Id;
            }

            return new StoreGistResponse { Gist = gist };
        }
    }
}