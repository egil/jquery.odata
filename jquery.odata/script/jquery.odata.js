/// <reference path="jquery-1.4.2.js" />
"use strict";
(function ($) {
    var odata,
        odataQuery,
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
            query,
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
            that = $.extend({}, this);
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
            that = $.extend({}, this);
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
            that = $.extend({}, this);
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
            that = $.extend({}, this);
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
            that = $.extend({}, this);
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
            that = $.extend({}, this);
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
            that = $.extend({}, this);
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
            that = $.extend({}, this);
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
            that = $.extend({}, this);

            // add params to query options object
            that.options = $.extend(true, that.options, { params: params });

            return that;
        };

        count = function (autoQuery) {
            ///	<summary>
            ///		Retrives the number of entries associated resource path.
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="completed" type="Function">
            ///		False makes method return a new odataQuery object. True retrives count imidiately. Default = true;
            ///	</param>        
            var that;

            autoQuery = autoQuery === undefined ? true : autoQuery;

            // create new OData Query object
            that = $.extend({}, this);

            // add count query string to query options object
            that.options = $.extend({}, that.options, { count: '$count' });

            if (autoQuery) {
                // execute the query
                query.apply(that);
            }
            else {
                return that;
            }
        };

        value = function (autoQuery) {
            ///	<summary>
            ///		Retrives the "raw value" of the specified property
            ///	</summary>
            ///	<returns type="odataQuery" />
            ///	<param name="autoQuery" type="Boolean">
            ///		False makes method return a new odataQuery object. True retrives raw value imidiately. Default = true;
            ///	</param>
            var that;

            autoQuery = autoQuery === undefined ? true : autoQuery;

            // create new OData Query object
            that = $.extend({}, this);

            // add value query string to query options object
            that.options = $.extend({}, that.options, { value: '$value' });

            if (autoQuery) {
                // execute the query
                query.apply(that);
            }
            else {
                return that;
            }
        };

        query = function (options) {
            ///	<summary>
            ///		Queries the OData service.
            ///	</summary>
            
            serviceCall(this, options);
        };

        // trim and remove both slashes from both start and end of resourcePath.
        that.resourcePath = trimSlashes(trim(resourcePath));

        // add options object
        that.options = {};

        // add methods
        that.value = value;
        that.count = count;
        that.query = query;
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
                        case 'inlinecount':
                            // inlinecount === none is the same as 
                            // not including inlinecount in query string.
                            if (opt.inlinecount.toUpperCase() !== 'NONE') {
                                if (needAmpersand) {
                                    qopts += '&';
                                }
                                qopts += "$" + p + "=" + opt[p];
                                needAmpersand = true;
                            }
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

        return query.serviceRootURI + '/' + resourcePath + (qopts !== '' ? '?' + qopts : '');
    };

    serviceCall = function (query, options) {
        var opt = query.options,
            settings;

        // extend settings with options.
        settings = jQuery.extend({
            protocol: query.settings.protocol
        }, options);

        // select dataType based on query
        if (settings.protocol !== 'jsonp') {
            if (opt.value !== undefined) {
                settings.protocol = '*/*';
            } else if (opt.count !== undefined) {
                settings.protocol = 'text';
            }
        }

        // todo: actually handle jsonp calls probably
        $.ajax({
            beforeSend: function (xhr) {
                // note: this function is not called when dataType = jsonp

                // Tell service we understand DataServiceVersion 2.0
                xhr.setRequestHeader('MaxDataServiceVersion', '2.0');

                // DataServiceVersion must be 2.0 if using
                // $count or $select query options
                if (opt.count === undefined && opt.select === undefined) {
                    xhr.setRequestHeader('DataServiceVersion', '1.0');
                }
                else {
                    xhr.setRequestHeader('DataServiceVersion', '2.0');
                }
            },
            dataFilter: function (data) {

            },
            dataType: settings.protocol,
            global: false,
            type: "GET",
            url: uriBuilder(query),
            success: function (data) {
                console.log(data);
            }
        });
    };

    $.odata = odata;
} (jQuery));