# passport-github-token-nest

### This is passport-github-token but transpiled with @babel-plugin-transform-classes so now it works with Nest.js as expected

#### Why? Nest.js PassportStrategy expects a function, not a class

#### Usage:

```html
import { Strategy } from 'passport-github-token-nest';

export class GithubStrategy extends PassportStrategy(Strategy, 'github'){}
```

![Build Status](https://img.shields.io/travis/ghaiklor/passport-github-token.svg)
![Coverage](https://img.shields.io/coveralls/ghaiklor/passport-github-token.svg)

![Downloads](https://img.shields.io/npm/dm/passport-github-token.svg)
![Downloads](https://img.shields.io/npm/dt/passport-github-token.svg)
![npm version](https://img.shields.io/npm/v/passport-github-token.svg)
![License](https://img.shields.io/npm/l/passport-github-token.svg)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![dependencies](https://img.shields.io/david/ghaiklor/passport-github-token.svg)
![dev dependencies](https://img.shields.io/david/dev/ghaiklor/passport-github-token.svg)

[Passport](http://passportjs.org/) strategy for authenticating with GitHub access tokens using the OAuth 2.0 API.

This module lets you authenticate using GitHub in your Node.js applications.
By plugging into Passport, GitHub authentication can be easily and unobtrusively integrated into any application or framework that supports [Connect](http://www.senchalabs.org/connect/)-style middleware, including [Express](http://expressjs.com/).

## Installation

```shell
npm install passport-github-token
```

## Usage

### Configure Strategy

The GitHub authentication strategy authenticates users using a GitHub account and OAuth 2.0 tokens.
The strategy requires a `verify` callback, which accepts these credentials and calls `next` providing a user, as well as `options` specifying a app ID and app secret.

```javascript
var GitHubTokenStrategy = require('passport-github-token');

passport.use(new GitHubTokenStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, next) {
    User.findOrCreate({'github.id': profile.id}, function(error, user) {
        return next(error, user);
    });
}));
```

### Authenticate Requests

Use `passport.authenticate()`, specifying the `github-token` strategy, to authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/) application:

```javascript
app.get('/auth/github', passport.authenticate('github-token'));
```

Or if you are using Sails framework:

```javascript
// AuthController.js
module.exports = {
    github: function(req, res) {
        passport.authenticate('github-token', function(error, user, info) {
            if (error) return res.serverError(error);
            if (info) return res.unauthorized(info);
            return res.ok(user);
        })(req, res);
    }
};
```

The request to this route should include a GET or POST data with the keys `access_token` and optionally, `refresh_token` set to the credentials you receive from GitHub.

```
GET /auth/github?access_token=<TOKEN>
```

## Issues

If you receive a `401 Unauthorized` error, it is most likely because you have wrong access token or not yet specified any application permissions.
Once you refresh access token with new permissions, try to send this access token again.

## License

[MIT](./LICENSE)
