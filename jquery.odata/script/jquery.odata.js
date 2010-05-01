/// <reference path="jquery-1.4.2.js" />
"use strict";
(function ($) {
    var odata,
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

    odata = function (serviceRootURI, options) {
        ///	<summary>
        ///		Create a new OData object that can be used to query against
        ///     the specified service root URI.
        ///	</summary>
        ///	<returns type="odata" />
        ///	<param name="serviceRootURI" type="String">
        ///		The service root URI of a OData service.
        ///	</param>
        var that, settings;

        // extend settings with options.
        settings = jQuery.extend({
            protocol: 'json'
        }, options);

        // constructs the odata object and assign data to it
        that = {};

        // trim and remove slashes from end of serviceRootURI.
        that.serviceRootURI = trimRightSlashes(trim(serviceRootURI));
        that.settings = settings;

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

        that.uriBuilder = uriBuilder;

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
            that.options.links = navigationProperty;

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
            that.options.orderby = orderbyQueryOption;

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
            that.options.top = numberOfEntries;

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
            that.options.skip = numberOfEntries;

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
            that.options.filter = filter;

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
            that.options.expand = entries;

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
            that.options.select = properties;

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

            inlinecount = inlinecount || "allpages";

            // create new OData Query object
            that = $.extend(true, {}, this);
            that.options.inlinecount = inlinecount;

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
            that.options = $.extend(true, that.options, { params: params });

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
            that.options = $.extend({}, that.options, { count: '$count' });

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
            that.options = $.extend({}, that.options, { value: '$value' });

            if (autoQuery) {
                // execute the query
                that.query(options);
            }
            else {
                return that;
            }
        };

        // trim and remove both slashes from both start and end of resourcePath.
        that.resourcePath = trimSlashes(trim(resourcePath));

        // add options object
        that.options = {};

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

        return that;
    };

    uriBuilder = function (query) {
        var p, needAmpersand, opt, qopts = '', resourcePath = '';

        // if query is undefined, assume uriBuilder is being called on a OData object.
        query = query || this;
        opt = query.options;

        // base part of resource path
        resourcePath = query.resourcePath !== undefined ? query.resourcePath : '';

        // add query options if specified
        if (opt !== undefined) {
            // start of extended part of resource path

            // addressing links between entries
            if (opt.links !== undefined) {
                resourcePath += '/$links/' + opt.links;
            }

            // add count if specified or ...
            if (query.options.count !== undefined) {
                resourcePath += '/' + query.options.count;
            }
            // add value if specified.
            else if (query.options.value !== undefined) {
                resourcePath += '/' + query.options.value;
            }

            // end of extended part of resource path

            // begining of query string options
            // if true, insert ambersand before adding next query string option
            needAmpersand = false;

            // add service operations params
            if (opt.params !== undefined) {
                for (p in opt.params) {
                    if (p !== undefined) {
                        if (needAmpersand) {
                            qopts += '&';
                        }
                        qopts += p + "=" + opt.params[p];
                        needAmpersand = true;
                    }
                }
            }

            // add query string options
            for (p in opt) {
                if (p !== undefined) {
                    switch (p) {
                        case 'inlinecount':
                            // inlinecount === none is the same as 
                            // not including inlinecount in query string.
                            if (opt.inlinecount.toUpperCase() === 'NONE') {
                                break;
                            }
                            // else fall through
                        case 'orderby':
                        case 'top':
                        case 'skip':
                        case 'filter':
                        case 'expand':
                        case 'select':
                            if (needAmpersand) {
                                qopts += '&';
                            }
                            qopts += "$" + p + "=" + opt[p];
                            needAmpersand = true;
                            break;
                    }
                }
            }
        }

        // specify $format=json in url if retriving json, i.e. not $count or $value.
        if (query.settings.protocol === 'jsonp') {
            if (needAmpersand) {
                qopts += '&';
            }
            qopts += '$format=json';
        }

        return query.serviceRootURI + (resourcePath !== '' ? '/' + resourcePath : '') + (qopts !== '' ? '?' + qopts : '');
    };

    serviceCall = function (query, options) {
        var opt = query.options,
            settings;

        // extend settings with options.
        settings = jQuery.extend({
            type: "GET"
        }, query.settings, options);

        // select dataType based on query
        if (settings.protocol !== 'jsonp') {
            if (opt.value !== undefined) {
                settings.protocol = '*/*';
            } else if (opt.count !== undefined) {
                settings.protocol = 'text';
            }
        }

        $.ajax({
            beforeSend: function (xhr) {
                // note: this function is not called when dataType = jsonp

                // Tell service we understand DataServiceVersion 2.0
                xhr.setRequestHeader('MaxDataServiceVersion', '2.0');

                // DataServiceVersion must be 2.0 if using
                // $count or $select query options
                if (opt.count === undefined && opt.select === undefined && opt.inlinecount === undefined) {
                    xhr.setRequestHeader('DataServiceVersion', '1.0');
                }
                else {
                    xhr.setRequestHeader('DataServiceVersion', '2.0');
                }

                // call users beforeSend if specified
                if ($.isFunction(settings.beforeSend)) {
                    settings.beforeSend(xhr);
                }
            },
            dataFilter: function (data) {
                data = JSON.parse(data, function (key, value) {
                    var dateTimeParts, date;
                    if (value != null) {
                        if (value.toString().indexOf('Date') !== -1) {
                            // "\/Date(<ticks>["+" | "-" <offset>)\/"
                            dateTimeParts = /^\/Date\((-?\d+)([-|+]\d+)?\)\/$/.exec(value);
                            if (dateTimeParts) {
                                // consider doing something with the offset part.
                                date = new Date(parseInt(dateTimeParts[1], 10));
                                return date;
                            }
                        }
                        return value;
                    }
                });
                return data;
            },
            dataType: settings.protocol,
            password: settings.password,
            username: settings.username,
            timeout: settings.timeout,
            type: settings.type,
            url: uriBuilder(query),
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