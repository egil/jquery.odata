"use strict";
var odataUri = function () {
    var that,
        uri,
        segments,
        stringify,
        parse,
    // trims slashes away from begining and end of string.
        trimSlashes = function (str) {
            return str.replace(/^\/+|\/+$/g, '');
        },
    // trims slashes away from the end of the string.
        trimRightSlashes = function (str) {
            return str.replace(/\/+$/g, '');
        },
    // use buildin String.trim function if one is available, otherwise use jQuery.trim.
        trim = typeof String.trim === 'function' ? String.trim : jQuery.trim;

    segments = {
        count: false,
        links: null,
        resource: null,
        root: null,
        value: false,
        options: {
            expand: null,
            filter: null,
            inlinecount: false,
            orderby: null,
            params: null,
            select: null,
            skip: null,
            skiptoken: null,
            top: null
        }
    };

    uri = null;

    parse = function (uriString, root) {
        var that,
            temp,
            resourcePath,
            queryString,
            index,
            parts;
        root = root || this.segments.root;

        // create new odataUri object to put result in.
        that = odataUri();

        // divide uriString into two portions, 
        //   parts[0] = the service root uri and resource path
        //   parts[0] = the query string options
        parts = uriString.split('?');

        if (parts.length > 2) {
            throw { name: 'invalid input', message: 'input string is not valid, to many ? in the string' };
        }

        queryString = parts[1];

        // set root
        that.segments.root = root;

        // find ressource path part of uri
        // NOTE: indexOf is case sensitive, thus toUpperCase
        temp = parts[0].toUpperCase();
        root = root.toUpperCase();

        // Location of resource path part in temp
        if (temp.indexOf(root) === 0) {
            // both root and uriString are absolute or relative
            resourcePath = parts[0].slice(root.length);
        } else if ((index = temp.indexOf(root)) > 0) {
            // root is absolute, uriString is relative (thus fits in uriString)
            resourcePath = parts[0].slice(root.length + index);
        } else {
            // uriString absolute, root is relative
            // remove one character from root at the time,
            // until we find the the start of temp.
            index = 0;
            do {
                root = root.slice(1);
                index += 1;
            } while (root.length > 0 && temp.indexOf(root) !== 0);

            resourcePath = parts[0].slice(root.length);
        }

        // resourcePath is now the entire resource path

        // look for $value option at the end of the 
        // resource path and strip it away if it exists
        parts = resourcePath.split('/$value');
        that.segments.value = parts.length === 2;
        resourcePath = parts[0];

        // look for $count option at the end of the 
        // resource path and strip it away if it exists
        parts = resourcePath.split('/$count');
        that.segments.count = parts.length === 2;
        resourcePath = parts[0];

        // look for $links only if $value was not
        // already found. $links and $value can not 
        // be used at the same time
        if (!that.segments.value && (parts = resourcePath.split('/$links/')).length === 2) {
            // we are done with resouce path part now
            that.segments.resource = parts[0];
            that.segments.links = parts[1];
        } else {
            that.segments.resource = resourcePath;
        }

        // parse query string part of uri
        if (queryString !== undefined && queryString.length > 0) {
            // first split query string in different parts.
            parts = queryString.split('&');
            // split individual parts on '='
            for (index = 0; index < parts.length; index += 1) {
                parts[index] = parts[index].split('=');
            }
            // add each part to right them.segment object
            while (parts.length > 0) {
                temp = parts.pop();
                switch (temp[0]) {
                    case '$orderby':
                        that.segments.options.orderby = temp[1];
                        break;
                    case '$top':
                        that.segments.options.top = temp[1];
                        break;
                    case '$skip':
                        that.segments.options.skip = temp[1];
                        break;
                    case '$filter':
                        that.segments.options.filter = temp[1];
                        break;
                    case '$expand':
                        that.segments.options.expand = temp[1];
                        break;
                    case '$select':
                        that.segments.options.select = temp[1];
                        break;
                    case '$skiptoken':
                        that.segments.options.skiptoken = temp[1];
                        break;
                    case '$inlinecount':
                        that.segments.options.inlinecount = temp[1] === 'allpages';
                        break;
                    case '$format':
                        that.segments.options.format = temp[1];
                        break;
                    default:
                        // catch custom parameters and service operation parameters
                        if (that.segments.options.params === null) {
                            that.segments.options.params = {};
                        }
                        that.segments.options.params[temp[0]] = temp[1];
                        break;
                }
            }
        }

        return that;
    };

    stringify = function (uriObject) {
        var opt,
            uriSegs,
            p,
            needAmpersand = false,
            resourcePath,
            qopts = '';

        uriObject = uriObject || this;
        uriSegs = uriObject.segments;
        opt = uriSegs.options;

        // if root is undefined, there is nothing to build.
        if (uriSegs.root === null) {
            return '';
        }

        // start out with just the resouce path, if that is defined.        
        resourcePath = uriSegs.resource !== null ? trimSlashes(trim(uriSegs.resource)) : '';

        // start of extended part of resource path

        // addressing links between entries
        if (uriSegs.links !== null) {
            resourcePath += '/$links/' + trimSlashes(uriSegs.links);
        }

        // add count if specified or ...
        if (uriSegs.count) {
            resourcePath += '/$count';
        }

        // add value if specified.
        else if (uriSegs.value) {
            resourcePath += '/$value';
        }

        // end of extended part of resource path

        // add query string options
        for (p in opt) {
            if (p !== undefined && opt[p] !== null) {
                switch (p) {
                    case 'params':
                        for (p in opt.params) {
                            if (p !== undefined) {
                                if (needAmpersand) {
                                    qopts += '&';
                                }
                                qopts += p + "=" + opt.params[p];
                                needAmpersand = true;
                            }
                        }
                        break;
                    case 'inlinecount':
                        // inlinecount === none is the same as 
                        // not including inlinecount in query string.
                        if (opt.inlinecount) {
                            if (needAmpersand) {
                                qopts += '&';
                            }
                            qopts += "$inlinecount=allpages";
                            needAmpersand = true;
                            break;
                        }
                        break;
                    case 'format':
                        //  // specify $format=json in url if retriving json, i.e. not $count or $value.
                        //  if (opt[p] === 'json' && !uriSegs.count && !uriSegs.value) {
                        //      if (needAmpersand) {
                        //          qopts += '&';
                        //      }
                        //      qopts += "$format=json";
                        //  }
                        //  break;
                    case 'orderby':
                    case 'top':
                    case 'skip':
                    case 'filter':
                    case 'expand':
                    case 'select':
                    case 'skiptoken':
                        if (needAmpersand) {
                            qopts += '&';
                        }
                        qopts += "$" + p + "=" + opt[p];
                        needAmpersand = true;
                        break;
                }
            }
        }
        uriObject.uri = trimRightSlashes(trim(uriSegs.root));
        uriObject.uri += (resourcePath !== '' ? '/' + resourcePath : '');
        uriObject.uri += (qopts !== '' ? '?' + qopts : '');
        return uriObject.uri;
    };

    that = {};
    that.segments = segments;
    that.parse = parse;
    that.uri = uri;
    that.toString = that.toLocaleString = stringify;

    that.isLocalService = that.segments.root !== null &&
    // and root starts with something else than http: or https:
                          (!/^http:\/\/|https:\/\//i.test(that.segments.root) ||
    // or contains the window.location.protocol + '//' + window.location.host at index 0
                          that.segments.root.toLowerCase().indexOf(location.protocol + '//' + location.host) === 0);


    return that;
};