/// <reference path="jquery-1.4.2.js" />
"use strict";
(function ($) {
    var trimSlashes,
        trim;

    // use buildin String.trim function if one is available, otherwise use homegrown...
    if (typeof String.trim === 'function') {
        trim = String.trim;
    }
    else {
        trim = function (str) {
            return str.replace(/^\s+|\s+$/g, '');
        };
    }

    trimSlashes = function (str) {
        return str.replace(/^\/+|\/+$/g, '');
    };

    // HACK: remove before publish. Enables VS2010 js intellisense
    $ = jQuery;

    $.odata = function (serviceRootURI) {
        ///	<summary>
        ///		Create a new OData object that can be used to query against
        ///     the specified service root URI.
        ///	</summary>
        ///	<returns type="OData" />
        ///	<param name="serviceRootURI" type="String">
        ///		The service root URI of a OData service.
        ///	</param>

        var odata, from;

        // constructs the odata object and assign data to it
        odata = {};

        odata.serviceRootURI = trim(trimSlashes(trim(serviceRootURI)));

        from = function (resourcePath) {
            ///	<summary>
            ///		Create a new OData Query object that defines a new query
            ///     which can be used to query against the OData service root URI.
            ///	</summary>
            ///	<returns type="QueryObject" />
            ///	<param name="resourcePath" type="String">
            ///		The resource path to query on the OData service.
            ///	</param>
            var that, count, value, query;

            count = function (completed, options) {
                ///	<summary>
                ///		Retrives the number of entries associated resource path.
                ///	</summary>
                ///	<param name="completed" type="Function">
                ///		Function to call with the return value.
                ///	</param>                    
                var x = $.extend(this, { type: 'count' }, options);
                query(completed, x);
            };

            value = function (completed, options) {
                ///	<summary>
                ///		Retrives the "raw value" of the specified property
                ///	</summary>
                ///	<param name="completed" type="Function">
                ///		Function to call with the return value.
                ///	</param>
                var x = $.extend(this, { type: 'value' }, options);
                query(completed, x);
            };

            query = function (completed, options) {
                

                $.ajax({
                    beforeSend: function (xhr) {
                        // this function is not called when dataType = jsonp
                        // tweak headers according to specs
                        var x;
                    },
                    dataType: "jsonp",
                    global: false, 
                    type: "GET",
                    url: options.serviceRootURI + '/' + options.resourcePath + '/$count',
                    success: completed
                });
            };

            that = $.extend({}, this);
            that.resourcePath = trim(trimSlashes(trim(resourcePath)));
            that.value = value;
            that.count = count;
            that.query = query;

            return that;
        };

        odata.from = from;

        return odata;
    };

} (jQuery));