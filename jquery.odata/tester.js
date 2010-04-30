$(document).ready(function () {
    //    var odatap = $.odata("http://services.odata.org/OData/OData.svc", { protocol: 'jsonp' }),
    //        prodsp = odatap.from("Categories(1)/Products"),
    //        prodsCityp = odatap.from("Categories(1)/Products(1)/Supplier/Address/City");

    //    prodsp.query();
    //    prodsp.count();
    //    prodsCityp.value();

    var odata = $.odata("http://localhost:32751/services/AdventureWorks.svc/"),
        prods = odata.from("Products"),
        prodName = odata.from("Products(680)/Name"),
        prodByColor = odata.from("GetProductsByColor");

    prodByColor.params({ 'color': 'Red' }).query();
    odata.from('Add').params({ 'start': 42 }).query();    

    //    prodName.value();
    //    prods.count();
    //    prods.query();
});
