const { OAuth2Strategy, InternalOAuthError } = require("passport-oauth");

/**
 * `Strategy` constructor.
 * The GitHub authentication strategy authenticates requests by delegating to GitHub using OAuth2 access tokens.
 * Applications must supply a `verify` callback which accepts a accessToken, refreshToken, profile and callback.
 * Callback supplying a `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occurs, `error` should be set.
 *
 * Options:
 * - clientID          Identifies client to GitHub App
 * - clientSecret      Secret used to establish ownership of the consumer key
 * - scope             Scope to get user's private emails
 * - passReqToCallback If need, pass req to verify callback
 *
 * @param {Object} _options
 * @param {Function} _verify
 * @example
 * passport.use(new GitHubTokenStrategy({
 *   clientID: '123456789',
 *   clientSecret: 'shhh-its-a-secret',
 *   scope: 'user:email',
 * }), function(accessToken, refreshToken, profile, next) {
 *   User.findOrCreate({githubId: profile.id}, function(error, user) {
 *     next(error, user);
 *   })
 * })
 */
class GitHubTokenStrategy extends OAuth2Strategy {
  constructor(_options, _verify) {
    let options = _options || {};
    let verify = _verify;

    options.authorizationURL =
      options.authorizationURL || "https://github.com/login/oauth/authorize";
    options.tokenURL =
      options.tokenURL || "https://github.com/login/oauth/access_token";

    super(options, verify);

    this.name = "github-token";
    this._accessTokenField = options.accessTokenField || "access_token";
    this._refreshTokenField = options.refreshTokenField || "refresh_token";
    this._profileURL = options.profileURL || "https://api.github.com/user";
    this._passReqToCallback = options.passReqToCallback;

    this._oauth2.useAuthorizationHeaderforGET(true);
  }

  /**
   * Authenticate method
   * @param {Object} req
   * @param {Object} options
   * @returns {*}
   */
  authenticate(req, options) {
    options = options || {};
    var self = this;
    let code =
      (req.body && req.body[this._accessTokenField]) ||
      (req.headers &&
        (req.headers[this._accessTokenField] ||
          req.headers[this._accessTokenField.toLowerCase()])) ||
      (req.query && req.query[this._accessTokenField]);

    if (!code)
      return this.fail({
        message: `You should provide ${this._accessTokenField}`,
      });

    this._oauth2.getOAuthAccessToken.call(
      this._oauth2,
      code,
      null,
      function (error, accessToken, refreshToken, params) {
        if (error) return self.error(error);
        if (!accessToken) {
          return self.fail({
            statusCode: 400,
            data: JSON.stringify(params),
          });
        }
        self._loadUserProfile(accessToken, (error, profile) => {
          if (error) return self.error(error);

          const verified = (error, user, info) => {
            if (error) return self.error(error);
            if (!user) return self.fail(info);

            return self.success(user, info);
          };

          if (self._passReqToCallback) {
            self._verify(req, accessToken, refreshToken, profile, verified);
          } else {
            self._verify(accessToken, refreshToken, profile, verified);
          }
        });
      }
    );
  }

  /**
   * Parse user profile
   * @param {String} accessToken GitHub OAuth2 access token
   * @param {Function} done
   */
  userProfile(accessToken, done) {
    this._oauth2.get(this._profileURL, accessToken, (error, body, res) => {
      if (error) {
        try {
          let errorJSON = JSON.parse(error.data);
          return done(
            new InternalOAuthError(errorJSON.message, error.statusCode)
          );
        } catch (_) {
          return done(
            new InternalOAuthError("Failed to fetch user profile", error)
          );
        }
      }

      let profile = {};

      try {
        let json = JSON.parse(body);
        profile = {
          provider: "github",
          id: json.id,
          username: json.login,
          displayName: json.name || "",
          name: {
            familyName: json.name ? json.name.split(' ').slice(-1).join(' ') || "" : "",
            givenName: json.name ? json.name.split(' ').slice(0, -1).join(' ') || "" : "",
          },
          emails: json.email && [{ value: json.email }],
          photos: [],
          _raw: body,
          _json: json,
        };
      } catch (e) {
        return done(e);
      }

      if (this._scope && this._scope.indexOf("user:email") !== -1) {
        this._oauth2.get(
          this._profileURL + "/emails",
          accessToken,
          function (error, body, res) {
            if (error) return done(null, profile);

            var json;
            try {
              json = JSON.parse(body);
            } catch (_) {
              return done(null, profile);
            }

            if (!json.length) return done(null, profile);

            profile.emails = profile.emails || [];
            var publicEmail = profile.emails[0];

            json.forEach(function (email) {
              if (publicEmail && publicEmail.value == email.email) {
                profile.emails[0].primary = email.primary;
                profile.emails[0].verified = email.verified;
              } else {
                profile.emails.push({
                  value: email.email,
                  primary: email.primary,
                  verified: email.verified,
                });
              }
            });

            done(null, profile);
          }
        );
      } else {
        done(null, profile);
      }
    });
  }
}

module.exports = {
  Strategy: GitHubTokenStrategy,
};
