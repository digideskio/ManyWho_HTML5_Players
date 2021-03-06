/*! jQuery REST Client - v0.0.4 - 2013-02-21
* https://github.com/jpillora/jquery.rest
* Copyright (c) 2013 Jaime Pillora; Licensed MIT */

(function () {
    'use strict';

    var Cache, Resource, Verb, defaultOpts, encode64, ieEncode, error, inheritExtend, s, stringify, validateOpts, validateStr, ajaxHeaders;

    error = function (msg) {
        throw "ERROR: jquery.rest: " + msg;
    };

    s = function (n) {
        var t;
        t = "";
        while (n-- > 0) {
            t += "  ";
        }
        return t;
    };

    var keyStr = "ABCDEFGHIJKLMNOP" +
                    "QRSTUVWXYZabcdef" +
                    "ghijklmnopqrstuv" +
                    "wxyz0123456789+/" +
                    "=";


    ieEncode = function (input) {
        input = escape(input);
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;
        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                        keyStr.charAt(enc3) +
                            keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);
        return output;
    };


    encode64 = function (s) {
        if (!window.btoa) {
            //error("You need a polyfill for 'btoa' to use basic auth.");
            return ieEncode(s);
        }
        return window.btoa(s);
    };

    stringify = function (obj) {
        if (!window.JSON) {
            error("You need a polyfill for 'JSON' to use stringify.");
        }
        return window.JSON.stringify(obj);
    };

    inheritExtend = function (a, b) {
        var F;
        F = function () { };
        F.prototype = a;
        return $.extend(true, new F(), b);
    };

    validateOpts = function (options) {
        if (!(options && $.isPlainObject(options))) {
            return false;
        }
        $.each(options, function (name) {
            if (defaultOpts[name] === undefined) {
                return error("Unknown option: '" + name + "'");
            }
        });
        return null;
    };

    validateStr = function (name, str) {
        if ('string' !== $.type(str)) {
            return error("'" + name + "' must be a string");
        }
    };

    defaultOpts = {
        url: '',
        cache: 0,
        cachableMethods: ['GET'],
        stringifyData: false,
        stripTrailingSlash: false,
        token: null,
        refreshToken: null,
        verbs: {
            'create': 'POST',
            'read': 'GET',
            'update': 'PUT',
            'delete': 'DELETE'
        },
        ajax: {
            dataType: 'json'
        }
    };

    Cache = (function () {

        function Cache(parent) {
            this.parent = parent;
            this.c = {};
        }

        Cache.prototype.valid = function (date) {
            var diff;
            diff = new Date().getTime() - date.getTime();
            return diff <= this.parent.opts.cache * 1000;
        };

        Cache.prototype.key = function (obj) {
            var key,
        _this = this;
            key = "";
            $.each(obj, function (k, v) {
                return key += k + "=" + ($.isPlainObject(v) ? "{" + _this.key(v) + "}" : v) + "|";
            });
            return key;
        };

        Cache.prototype.get = function (key) {
            var result;
            result = this.c[key];
            if (!result) {
                return;
            }
            if (this.valid(result.created)) {
                return result.data;
            }
        };

        Cache.prototype.put = function (key, data) {
            return this.c[key] = {
                created: new Date(),
                data: data
            };
        };

        Cache.prototype.clear = function (regexp) {
            var _this = this;
            if (regexp) {
                return $.each(this.c, function (k) {
                    if (k.match(regexp)) {
                        return delete _this.c[k];
                    }
                });
            } else {
                return this.c = {};
            }
        };

        return Cache;

    })();

    Verb = (function () {

        function Verb(name, method, options, parent) {
            this.name = name;
            this.method = method;
            if (options == null) {
                options = {};
            }
            this.parent = parent;
            validateStr('name', this.name);
            validateStr('method', this.method);
            validateOpts(options);
            if (this.parent[this.name]) {
                error("Cannot add Verb: '" + name + "' already exists");
            }
            this.method = method.toUpperCase();
            if (!options.url) {
                options.url = '';
            }
            this.opts = inheritExtend(this.parent.opts, options);
            this.root = this.parent.root;
            this.custom = !defaultOpts.verbs[this.name];
            this.call = $.proxy(this.call, this);
            this.call.instance = this;
        }

        Verb.prototype.call = function () {
            var r;
            r = this.parent.extractUrlData(this.method, arguments);
            if (this.custom) {
                r.url += this.opts.url || this.name;
            }
            return this.parent.ajax.call(this, this.method, r.url, r.data, ajaxHeaders);
        };

        Verb.prototype.show = function (d) {
            return console.log(s(d) + this.name + ": " + this.method);
        };

        return Verb;

    })();

    Resource = (function () {

        function Resource(nameOrUrl, options, parent) {
            if (options == null) {
                options = {};
            }
            validateOpts(options);
            if (parent && parent instanceof Resource) {
                this.name = nameOrUrl;
                validateStr('name', this.name);
                this.constructChild(parent, options);
            } else {
                this.url = nameOrUrl || '';
                validateStr('url', this.url);
                this.constructRoot(options);
            }
        }

        Resource.prototype.setAjaxOptons = function (options) {
            for (var prop in options) {
                if (prop in defaultOpts) {
                    defaultOpts[prop] = options[prop];
                }

            }
        };

        Resource.prototype.setAjaxHeaders = function (options) {
            ajaxHeaders = options;
        };

        Resource.prototype.constructRoot = function (options) {
            this.opts = inheritExtend(defaultOpts, options);
            this.root = this;
            this.numParents = 0;
            this.urlNoId = this.url;
            this.cache = new Cache(this);
            this.parent = null;
            return this.name = this.opts.name || 'ROOT';
        };

        Resource.prototype.constructChild = function (parent, options) {
            this.parent = parent;
            validateStr('name', this.name);
            if (!(this.parent instanceof Resource)) {
                this.error("Invalid parent");
            }
            if (this.parent[this.name]) {
                this.error("'" + name + "' already exists");
            }
            if (!options.url) {
                options.url = '';
            }
            this.opts = inheritExtend(this.parent.opts, options);
            this.root = this.parent.root;
            this.numParents = this.parent.numParents + 1;
            this.urlNoId = this.parent.url + ("" + (this.opts.url || this.name) + "/");
            this.url = this.urlNoId + (":ID_" + this.numParents + "/");
            $.each(this.opts.verbs, $.proxy(this.addVerb, this));
            if (this["delete"]) {
                return this.del = this["delete"];
            }
        };

        Resource.prototype.error = function (msg) {
            return error("Cannot add Resource: " + msg);
        };

        Resource.prototype.add = function (name, options) {
            return this[name] = new Resource(name, options, this);
        };

        Resource.prototype.addVerb = function (name, method, options) {
            return this[name] = new Verb(name, method, options, this).call;
        };

        Resource.prototype.show = function (d) {
            var _this = this;
            if (d == null) {
                d = 0;
            }
            if (d > 25) {
                error("Plugin Bug! Recursion Fail");
            }
            if (this.name) {
                console.log(s(d) + this.name + ": " + this.url);
            }
            $.each(this, function (name, fn) {
                if ($.type(fn) === 'function' && fn.instance instanceof Verb && name !== 'del') {
                    return fn.instance.show(d + 1);
                }
            });
            $.each(this, function (name, res) {
                if (name !== "parent" && name !== "root" && res instanceof Resource) {
                    return res.show(d + 1);
                }
            });
            return null;
        };

        Resource.prototype.toString = function () {
            return this.name;
        };

        Resource.prototype.extractUrlData = function (name, args) {
            var arg, canUrl, canUrlNoId, data, i, id, ids, msg, numIds, t, url, _i, _j, _len, _len1;
            ids = [];
            data = null;
            for (_i = 0, _len = args.length; _i < _len; _i++) {
                arg = args[_i];
                t = $.type(arg);
                if (t === 'string' || t === 'number') {
                    ids.push(arg);
                } else if ($.isPlainObject(arg) && data === null) {
                    data = arg;
                } else {
                    error(("Invalid argument: " + arg + " (" + t + ").") + " Must be strings or ints (IDs) followed by one optional plain object (data).");
                }
            }
            numIds = ids.length;
            canUrl = name !== 'create';
            canUrlNoId = name !== 'update' && name !== 'delete';
            url = null;
            if (canUrl && numIds === this.numParents) {
                url = this.url;
            }
            if (canUrlNoId && numIds === this.numParents - 1) {
                url = this.urlNoId;
            }
            if (url === null) {
                if (canUrlNoId) {
                    msg = this.numParents - 1;
                }
                if (canUrl) {
                    msg = (msg ? msg + ' or ' : '') + this.numParents;
                }
                error("Invalid number of ID arguments, required " + msg + ", provided " + numIds);
            }
            for (i = _j = 0, _len1 = ids.length; _j < _len1; i = ++_j) {
                id = ids[i];
                url = url.replace(new RegExp("\/:ID_" + (i + 1) + "\/"), "/" + id + "/");
            }
            return {
                url: url,
                data: data
            };
        };

        Resource.prototype.ajax = function (method, url, data, headers) {
            var ajaxOpts, encoded, key, req, useCache,
        _this = this;
            if (headers == null) {
                headers = {};
            }
            if (!method) {
                error("method missing");
            }
            if (!url) {
                error("url missing");
            }
            if (this.opts.token && this.opts.refreshToken) {
                encoded = encode64(this.opts.token + ":" + this.opts.refreshToken);
                headers.Authorization = "Basic " + encoded;
            }
            else if (this.opts.token) {
                encoded = encode64(this.opts.token);
                headers.Authorization = "Basic " + encoded;
            }
            if (data && this.opts.stringifyData) {
                data = stringify(data);
            }
            if (this.opts.stripTrailingSlash) {
                url = url.replace(/\/$/, "");
            }
            ajaxOpts = {
                url: url,
                type: method,
                headers: headers
            };
            if (data) {
                ajaxOpts.data = data;
            }
            ajaxOpts = $.extend(true, {}, this.opts.ajax, ajaxOpts, headers);
            useCache = this.opts.cache && $.inArray(method, this.opts.cachableMethods) >= 0;
            if (useCache) {
                key = this.root.cache.key(ajaxOpts);
                req = this.root.cache.get(key);
                if (req) {
                    return req;
                }
            }
            req = $.ajax(ajaxOpts);
            if (useCache) {
                req.done(function () {
                    return _this.root.cache.put(key, req);
                });
            }
            return req;
        };

        return Resource;

    })();

    Resource.defaults = defaultOpts;

    $.RestClient = Resource;

}).call(this);
