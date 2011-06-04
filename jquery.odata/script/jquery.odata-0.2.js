/// <reference path="jquery-1.6.1.js" />
"use strict";
(function ($) {
    var odata,
        odataUri,
        odataQuery,
        odataQueryResult,
        serviceCall;

    odataUri = function (uriSegments) {
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
                callback: null,
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

        if (uriSegments !== undefined) {
            // if uri is an object, assume it is a odataUri object, 
            // otherwise assume its a service root uri.
            if ($.isPlainObject(uriSegments)) {
                if (uriSegments.segments === undefined) {
                    $.extend(true, segments, uriSegments);
                } else {
                    $.extend(true, segments, uriSegments.segments);
                }
            } else if (typeof uriSegments === 'string') {
                $.extend(true, segments, { root: uriSegments });
            }
        }

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
                            // specify $format=json in url if retriving json, i.e. not $count or $value.
                            if (opt[p] === 'json' && (uriSegs.count || uriSegs.value)) {
                                break;
                            }
                        case 'callback':
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

    odata = function (uri, options) {
        ///	<summary>
        ///		Create a new OData object that can be used to query against
        ///     the specified service root URI.
        ///	</summary>
        ///	<returns type="odata" />
        var that;

        // constructs the odata object and assign data to it
        that = {};
        that.settings = options || {};
        that.uri = odataUri(uri);

        // if protocol is jsonp, $format=json needs to 
        // be added to the query string options.
        if (that.settings.dataType !== undefined && that.settings.dataType === 'jsonp') {
            that.uri.segments.options.format = 'json';
            that.uri.segments.options.callback = 'resultCallback';
        }

        that.from = function (resourcePath) {
            ///	<summary>
            ///		Create a new OData Query object that defines a new query
            ///     which can be used to query against the OData service root URI.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="resourcePath" type="String">
            ///		The resource path to query on the OData service.
            ///	</param>    
            return odataQuery.apply($.extend({}, this), [resourcePath]);
        };

        that.query = function (options) {
            ///	<summary>
            ///		Queries the OData service.
            ///	</summary>

            // allow users to pass in just a callback 
            // function in case of success.
            if ($.isFunction(options)) {
                options = { success: options };
            }

            serviceCall(this, options);
        };

        that.create = function (resourcePath, entry, options) {
            ///	<summary>
            ///		Create a new entry on the specified OData resource path.
            ///	</summary>
            var that;

            // allow users to pass in just a callback 
            // function in case of success.
            if ($.isFunction(options)) {
                options = { success: options };
            }

            options.type = "POST";
            options.data = JSON.stringify(entry);

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.resource = resourcePath;

            serviceCall(that, options);
        };

        that.update = function (resourcePath, entry, options) {
            ///	<summary>
            ///		Update an entry on the specified OData resource path.
            ///	</summary>
            var that,
                settings,
                defaults = {
                    partial: true,
                    force: false,
                    etag: null
                };

            // allow users to pass in just a callback 
            // function in case of success.
            if ($.isFunction(options)) {
                options = { complete: options };
            }

            // look for etag in entry.__metadata.
            if (options.etag === undefined && entry.__metadata !== undefined && entry.__metadata.etag !== undefined) {
                options.etag = entry.__metadata.etag;
            }

            // copy options from user
            settings = $.extend({}, defaults, options);

            // if partialUpdate is true we must use HTTP MERGE
            settings.type = settings.partial ? "MERGE" : "PUT";


            // if updating a value directly, use 'text/plain' content type.
            if ($.isPlainObject(entry)) {
                settings.data = JSON.stringify(entry);
                settings.contentType = 'application/json';
            }
            else {
                settings.data = entry.toString();
                settings.contentType = 'text/plain';
            }

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.resource = resourcePath;
            serviceCall(that, settings);
        };

        that['delete'] = that.deleteEntry = that.remove = function (entry, options) {
            var that,
                settings,
                defaults = {
                    force: false,
                    etag: null
                };

            // allow users to pass in just a callback 
            // function in case of success.
            if ($.isFunction(options)) {
                options = { complete: options };
            }

            // look for etag in entry.__metadata.
            if (options.etag === undefined && entry.__metadata !== undefined && entry.__metadata.etag !== undefined) {
                options.etag = entry.__metadata.etag;
            }

            // copy options from user
            settings = $.extend({}, defaults, options);

            // if forceUpdate is true, ignore possible ETag and always override 
            if (settings.force) {
                settings.etag = '*';
            }

            settings.type = "DELETE";

            // create new OData Query object
            that = $.extend(true, {}, this);

            // if entry is a object, look for uri in __metadata.uri.
            // else we assume that entry is a string, i.e. the resource path
            // to the entry that should be deleted.
            if ($.isPlainObject(entry)) {
                if (entry.__metadata !== undefined && entry.__metadata.uri !== undefined) {
                    // if we get a entry object with metadata, pick the uri from that
                    that.uri = that.uri.parse(entry.__metadata.uri);
                }
                else {
                    // otherwise assume an odataUri object
                    that.uri = entry;
                }
            } else if (typeof entry === 'string') {
                that.uri = that.uri.parse(entry);
            }
            serviceCall(that, settings);
        };

        return that;
    };

    odataQuery = function (resourcePath) {
        ///	<summary>
        ///		Create a new OData Query object that defines a new query
        ///     which can be used to query against the OData service root URI.
        ///	</summary>
        ///	<returns type="odataQuery" />
        ///	<param name="resourcePath" type="String">
        ///		The resource path to query on the OData service.
        ///	</param>    
        var that = this,
            value,
            count,
            links,
            params,
            orderby,
            top,
            skip,
            filter,
            expand,
            select,
            inlinecount;

        links = function (navigationProperty) {
            ///	<summary>
            ///     Retrive URI for the specified navigation property.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="navigationProperty" type="String">
            ///	</param>                
            var that;

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.links = navigationProperty;

            return that;
        };

        orderby = function (orderbyQueryOption) {
            ///	<summary>
            ///		The orderby System Query Option specifies an expression for determining 
            ///     what values are used to order the collection of Entries identified by 
            ///     the Resource Path section of the URI.
            ///	</summary>
            /// <remarks>
            ///     This query option is only supported when the resource path identifies a Collection of Entries.
            /// </remarks>
            ///	<returns type="odataQuery" />
            ///	<param name="orderbyQueryOption" type="String">
            ///		Examples: "Rating asc"
            ///               "Rating,Category/Name desc"
            ///	</param>                
            var that;

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.options.orderby = orderbyQueryOption;

            return that;
        };

        top = function (numberOfEntries) {
            ///	<summary>
            ///		Specify the maximum amount of entries to return from the 
            ///     Collection of Entries identified by the Resource Path in this query object.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="numberOfEntries" type="Number">
            ///		Maximum number of entries to return.
            ///	</param>                
            var that;

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.options.top = numberOfEntries;

            return that;
        };

        skip = function (numberOfEntries) {
            ///	<summary>
            ///		Specify the amount of entries to skip in the resultset.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="numberOfEntries" type="Number">
            ///		Number of entries to skip.
            ///	</param>                
            var that;

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.options.skip = numberOfEntries;

            return that;
        };

        filter = function (filter) {
            ///	<summary>
            ///		A filter expression used to filter out entries in the resultset.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="filter" type="String">
            ///		A valid OData filter expression string.
            ///	</param>                
            var that;

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.options.filter = filter;

            return that;
        };

        expand = function (entries) {
            ///	<summary>
            ///		Indicate that Entries associated with the Entry or Collection 
            ///     of Entries identified by the Resource Path section of the 
            ///     URI must be represented inline (i.e. eagerly loaded).
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="entries" type="String">
            ///		The syntax of a $expand query option is a comma-separated 
            ///     list of Navigation Properties.
            ///     Additionally each Navigation Property can be followed by 
            ///     a forward slash and another Navigation Property 
            ///     to enable identifying a multi-level relationship.
            ///	</param>                
            var that;

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.options.expand = entries;

            return that;
        };

        select = function (properties) {
            ///	<summary>
            ///     A comma seperated list of properties to return.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="properties" type="String">            
            ///	</param>                
            var that;

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.options.select = properties;

            return that;
        };

        inlinecount = function (inlinecount) {
            ///	<summary>
            ///     A comma seperated list of properties to return.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="inlinecount" type="String">
            ///	</param>                
            var that;

            // set default value if inlinecount argument is not specified
            inlinecount = inlinecount === undefined ? true : inlinecount;

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.uri.segments.options.inlinecount = inlinecount;

            return that;
        };

        params = function (params) {
            ///	<summary>
            ///		Assign Service Operations parameters to this OData Query object.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="params" type="Object">
            ///		Argument must be in the form of an object.
            ///	</param>                
            var that;

            // create new OData Query object
            that = $.extend(true, {}, this);

            // add params to query options object
            that.uri.segments.options.params = params;

            return that;
        };

        count = function (args) {
            ///	<summary>
            ///		Retrives the number of entries associated resource path.
            ///	</summary>
            ///	<returns type="odataQuery" />
            var that,
                autoQuery = true,
                options = args;

            if (typeof args === 'boolean') {
                autoQuery = args;
            } else if ($.isFunction(args)) {
                options = { success: args };
            } else if (args === undefined) {
                autoQuery = false;
            }

            // create new OData Query object
            that = $.extend(true, {}, this);

            // add count query string to query options object
            that.uri.segments.count = true;

            if (autoQuery) {
                // execute the query
                that.query(options);
            }
            else {
                return that;
            }
        };

        value = function (args) {
            ///	<summary>
            ///		Retrives the "raw value" of the specified property
            ///	</summary>
            ///	<returns type="odataQuery" />
            var that,
                autoQuery = true,
                options = args;

            if (typeof args === 'boolean') {
                autoQuery = args;
            } else if ($.isFunction(args)) {
                options = { success: args };
            } else if (args === undefined) {
                autoQuery = false;
            }

            // create new OData Query object
            that = $.extend(true, {}, this);

            // add value query string to query options object
            that.uri.segments.value = true;

            if (autoQuery) {
                // execute the query
                that.query(options);
            }
            else {
                return that;
            }
        };

        that.uri.segments.resource = resourcePath;

        // add methods
        that.value = value;
        that.count = count;
        that.params = params;
        that.orderby = orderby;
        that.top = top;
        that.skip = skip;
        that.filter = filter;
        that.expand = expand;
        that.select = select;
        that.links = links;
        that.inlinecount = inlinecount;

        return that;
    };

    odataQueryResult = function (data, xhr, query) {
        var that = {};

        that.data = data.d === undefined ? data : data.d;
        if (xhr !== undefined) {
            that.version = xhr.getResponseHeader("DataServiceVersion").replace(';', '');
            that.ETag = xhr.getResponseHeader("ETag");
            that.status = xhr.status;
            that.statusText = xhr.statusText;
        }
        that.query = query;

        return that;
    };

    serviceCall = function (query, options) {
        var resultCallback,
            settings,
            defaults = {
                contentType: 'application/json',
                dataType: 'json',
                etag: null,
                type: "GET"
            };

        // extend settings with options and defaults.
        settings = jQuery.extend({}, defaults, query.settings, options);

        // if type is PUT, DELETE or MERGE, use POST and specify
        // correct HTTP type through X-HTTP-Method header. 
        // this enables support for browsers that do not support
        // one or more of PUT, DELETE or MERGE.
        settings.actualType = settings.type === "PUT" ||
                              settings.type === "DELETE" ||
                              settings.type === "MERGE" ? "POST" : settings.type;

        // select dataType based on query
        if (settings.type === 'GET' && settings.dataType !== 'jsonp') {
            if (query.uri.value) {
                settings.dataType = '*/*';
            } else if (query.uri.count) {
                settings.dataType = 'text';
            }
        } 
        
// Removed dataFilter
//        else if (settings.type === "PUT" || settings.type === "DELETE" || settings.type === "MERGE") {
//            // we need to set dataType = '*/*' since we do not expect any data
//            // back from the server. If we do not specify */*, dataFilter 
//            // and JSON.parse will try to parse the data and fail
//            settings.dataType = '*/*';
//        }

//        if (settings.type === "DELETE") {
//            settings.dataType = '*/*';
//        }

        // handle jsonp properly
        if (settings.dataType === 'jsonp') {
            settings.jsonpCallback = "resultCallback";
        }

        // The success callback won't be called for 204 responses from
        // DELETE, PUT, or MERGE so we need to create both a success and
        // complete callback

        // define callback function on results. 
        resultCallback = function (data, textStatus, xhr) {
            if ($.isFunction(settings.success)) {
                settings.success(odataQueryResult(data, xhr, query), textStatus, xhr);
            }
        };



        // Don't use dataFilter with JSON, use converters instead:
        // http://forum.jquery.com/topic/datafilter-function-and-json-string-result-problems
        // See timetracker/timetracker.js for an example

//        dataFilter = function (data, type) {
//            if (type === 'json' || type === 'jsonp') {
//                data = JSON.parse(data, function (key, value) {
//                    var dateTimeParts, date;
//                    if (value !== null) {
//                        if (value.toString().indexOf('Date') !== -1) {
//                            // "\/Date(<ticks>["+" | "-" <offset>)\/"
//                            dateTimeParts = /^\/Date\((-?\d+)([\-|+]\d+)?\)\/$/.exec(value);
//                            if (dateTimeParts) {
//                                // consider doing something with the offset part.
//                                date = new Date(parseInt(dateTimeParts[1], 10));
//                                return date;
//                            }
//                        }
//                        return value;
//                    }
//                });
//            }
//            return data;
//        };

        $.ajax({
            beforeSend: function (xhr) {
                // note: this function is not called when dataType = jsonp

                // Tell service we understand DataServiceVersion 2.0
                xhr.setRequestHeader('MaxDataServiceVersion', '2.0');

                // DataServiceVersion must be 2.0 if using
                // $count, $inlinecount or $select query options
                if (query.uri.segments.count || query.uri.segments.options.inlinecount || query.uri.segments.options.select !== undefined) {
                    xhr.setRequestHeader('DataServiceVersion', '2.0');
                }
                else {
                    xhr.setRequestHeader('DataServiceVersion', '1.0');
                }

                // Concurrency control
                if (settings.etag !== null) {
                    xhr.setRequestHeader('If-Match', settings.etag);
                }

                if (options.type === "DELETE" || options.type === "PUT" || options.type === "MERGE") {
                    xhr.setRequestHeader('X-HTTP-Method', options.type);
                }

                // call users beforeSend if specified
                if ($.isFunction(settings.beforeSend)) {
                    settings.beforeSend(xhr);
                }
            },
            //dataFilter: dataFilter,
            data: settings.data,
            dataType: settings.dataType,
            contentType: settings.contentType,
            password: settings.password,
            username: settings.username,
            timeout: settings.timeout,
            type: settings.actualType,
            jsonpCallback: settings.jsonpCallback,
            processData: false,
            url: query.uri.toString(),
            success: resultCallback,
            complete: settings.complete,
            error: settings.error
        });
    };

    $.odata = odata;
    $.odataUri = odataUri;
} (jQuery));