$(document).ready(function () {
    //    var odatap = $.odata("http://services.odata.org/OData/OData.svc", { protocol: 'jsonp' }),
    //        prodsp = odatap.from("Categories(1)/Products"),
    //        prodsCityp = odatap.from("Categories(1)/Products(1)/Supplier/Address/City");

    //    prodsp.query();
    //    prodsp.count();
    //    prodsCityp.value();

    var odata = $.odata("http://localhost:32751/services/AdventureWorks.svc/"),
        prods = odata.from("Products"),
        prodByColor = odata.from("GetProductsByColor");

    //    prods.query({
    //        success: function (data, textStatus, xhr) {
    //            var asdf;
    //        }
    //    });

    //    prods.query(function (data, textStatus, xhr) {
    //        var asdf;
    //    });

    prods.count({
        success: function (data, textStatus, xhr) {
            var asdf;
        }
    });

    prods.count(function (data, textStatus, xhr) {
        var asdf;
    });

    // TODO DOES NOT WORK!!!
    odata.from("Products(680)/Name").value(function (data, textStatus, xhr) {
        $("p").html(data.data);
    });
});
