/// <reference path="jquery-1.6.1.js" />
"use strict";
(function ($) {
    var odata,
        odataUri,
        odataQuery,
        odataQueryResult,
    // trims slashes away from begining and end of string.
        trimSlashes = function (str) {
            return str.replace(/^\/+|\/+$/g, '');
        },
    // trims slashes away from the end of the string.
        trimRightSlashes = function (str) {
            return str.replace(/\/+$/g, '');
        },
    // use buildin String.trim function if one is available, otherwise use jQuery.trim.
        trim = typeof String.trim === 'function' ? String.trim : jQuery.trim,
        serviceCall,
        uriBuilder;

    // HACK: remove before publish. Enables VS2010 jQuery intellisense in closure.
    $ = jQuery;

    odata = function (uri, options) {
        ///	<summary>
        ///		Create a new OData object that can be used to query against
        ///     the specified service root URI.
        ///	</summary>
        ///	<returns type="odata" />
        ///	<param name="serviceRootURI" type="String">
        ///		The service root URI of a OData service.
        ///	</param>
        var that;

        // constructs the odata object and assign data to it
        that = {};
        that.uriParts = $.isPlainObject(uri) ? odataUri(uri) : odataUri({ root: uri });
        that.settings = options || {};

        // if protocol is jsonp, $format=json needs to 
        // be added to the query string options.
        if (that.settings.dataType !== undefined && that.settings.dataType === 'jsonp') {
            that.uriParts.options.format = 'json';
        }

        // construct uri
        that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.resource = resourcePath;
            that.uri = uriBuilder(that.uriParts);

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
                options = { success: options };
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
            that.uriParts.resource = resourcePath;
            that.uri = uriBuilder(that.uriParts);
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
                options = { success: options };
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
            //that.uriParts.resource = resourcePath;
            that.uriParts = odataUri();

            // if entry is a object, look for uri in __metadata.uri.
            // else we assume that entry is a string, i.e. the resource path
            // to the entry that should be deleted.
            if ($.isPlainObject(entry) && entry.__metadata !== undefined && entry.__metadata.uri !== undefined) {
                that.uri = entry.__metadata.uri;
            } else {
                that.uri = entry;
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
            that.uriParts.links = navigationProperty;
            that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.options.orderby = orderbyQueryOption;
            that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.options.top = numberOfEntries;
            that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.options.skip = numberOfEntries;
            that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.options.filter = filter;
            that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.options.expand = entries;
            that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.options.select = properties;
            that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.options.inlinecount = inlinecount;
            that.uri = uriBuilder(that.uriParts);

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
            that.uriParts.options.params = params;
            that.uri = uriBuilder(that.uriParts);

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
            }

            // create new OData Query object
            that = $.extend(true, {}, this);

            // add count query string to query options object
            that.uriParts.count = true;
            that.uri = uriBuilder(that.uriParts);

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
            }

            // create new OData Query object
            that = $.extend(true, {}, this);

            // add value query string to query options object
            that.uriParts.value = true;
            that.uri = uriBuilder(that.uriParts);

            if (autoQuery) {
                // execute the query
                that.query(options);
            }
            else {
                return that;
            }
        };

        // trim and remove both slashes from both start and end of resourcePath.
        that.uriParts.resource = resourcePath;
        that.uri = uriBuilder(that.uriParts);

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
        that.version = xhr.getResponseHeader("DataServiceVersion").replace(';', '');
        that.ETag = xhr.getResponseHeader("ETag");
        that.status = xhr.status;
        that.statusText = xhr.statusText;
        that.query = query;

        return that;
    };

    odataUri = function (uriParts) {
        var that;

        // define uri object default structure
        that = {
            value: false,
            count: false,
            options: {
                inlinecount: false
            }
        };
        if (uriParts !== undefined) {
            $.extend(that, uriParts);
        }
        return that;
    };

    uriBuilder = function (uri) {
        var opt = uri.options,
            p,
            needAmpersand = false,
            resourcePath,
            qopts = '';

        // if root is undefined, there is nothing to build.
        if (uri.root === undefined) {
            return '';
        }

        // start out with just the resouce path, if that is defined.        
        resourcePath = uri.resource !== undefined ? trimSlashes(trim(uri.resource)) : '';

        // start of extended part of resource path

        // addressing links between entries
        if (uri.links !== undefined) {
            resourcePath += '/$links/' + uri.links;
        }

        // add count if specified or ...
        if (uri.count) {
            resourcePath += '/$count';
        }

        // add value if specified.
        else if (uri.value) {
            resourcePath += '/$value';
        }

        // end of extended part of resource path

        // add query string options
        for (p in opt) {
            if (p !== undefined) {
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
                    case 'format':
                        // specify $format=json in url if retriving json, i.e. not $count or $value.
                        if (opt[p] === 'json' && !uri.count && !uri.value) {
                            if (needAmpersand) {
                                qopts += '&';
                            }
                            qopts += "$format=json";
                        }
                        break;

                }
            }
        }

        return trimRightSlashes(trim(uri.root)) + (resourcePath !== '' ? '/' + resourcePath : '') + (qopts !== '' ? '?' + qopts : '');
    };

    serviceCall = function (query, options) {
        var settings,
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
        } else if (settings.type === "PUT" || settings.type === "DELETE" || settings.type === "MERGE") {
            // we need to set dataType = '*/*' since we do not expect any data
            // back from the server. If we do not specify */*, dataFilter 
            // and JSON.parse will try to parse the data and fail
            settings.dataType = '*/*';
        }

        if(settings.type === "DELETE"){
            settings.dataType = '*/*';
        }

        $.ajax({
            beforeSend: function (xhr) {
                // note: this function is not called when dataType = jsonp

                // Tell service we understand DataServiceVersion 2.0
                xhr.setRequestHeader('MaxDataServiceVersion', '2.0');

                // DataServiceVersion must be 2.0 if using
                // $count, $inlinecount or $select query options
                if (query.uriParts.count || query.uriParts.options.inlinecount || query.uriParts.options.select !== undefined) {
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
            dataFilter: function (data, type) {
                if (type === 'json' || type === 'jsonps') {
                    data = JSON.parse(data, function (key, value) {
                        var dateTimeParts, date;
                        if (value !== null) {
                            if (value.toString().indexOf('Date') !== -1) {
                                // "\/Date(<ticks>["+" | "-" <offset>)\/"
                                dateTimeParts = /^\/Date\((-?\d+)([\-|+]\d+)?\)\/$/.exec(value);
                                if (dateTimeParts) {
                                    // consider doing something with the offset part.
                                    date = new Date(parseInt(dateTimeParts[1], 10));
                                    return date;
                                }
                            }
                            return value;
                        }
                    });
                }
                return data;
            },
            data: settings.data,
            dataType: settings.dataType,
            contentType: settings.contentType,
            password: settings.password,
            username: settings.username,
            timeout: settings.timeout,
            type: settings.actualType,
            processData: false,
            url: query.uri,
            success: function (data, textStatus, xhr) {
                if ($.isFunction(settings.success)) {
                    settings.success(odataQueryResult(data, xhr, query), textStatus, xhr);
                }
            },
            complete: settings.complete,
            error: settings.error
        });
    };

    $.odata = odata;
} (jQuery));