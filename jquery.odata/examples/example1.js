// future improvments ... ideas
// many use $metadata to do some kind of scaffolding
// is this even nessesary with jquery, do we gain anything from
// $metadata that we can use in javascript?


// create odata object
// first argument is the "service root URI"
// $.odata(serviceRootURI)
var odata = $.odata("http://services.odata.org/OData/OData.svc");

// basic querying without filtering
// odata.from("xx") returns a new query object that can be reused
var queryObject1 = odata.from("Categories");
var queryObject2 = odata.from("Categories(1)/Products");

// selec data from the queryObject
// argument: a callback function called when the query returns.
queryObject1.select(function (data) { });

// Question: Should this be the way to select the number of entities in a collection?
//           Alternativly, many use a overloaded queryObject.select('count', callback fn) call?
queryObject1.count(function (count) { });

// Question: Should this be the way to select the number of entities in a collection?
//           Alternativly, many use a overloaded queryObject.select('value', callback fn) call? 
queryObject1.value(function (value) { });

// calling service operations works like calling any other entity
// use from function
var serviceOp1 = odata.from("ProductsByColor");
var serviceOp2 = odata.from("ProductsByColor(3)/Category/Name");

// use params function to specify service operation arguments,
// done in a object notation
// Question: Should select be overloaded to take the params object as an argument
//           serviceOp1.select({ 'color': 'blue' }, function (data) { });
serviceOp1.params({ 'color': 'red' })
serviceOp2.params({ 'color': 'blue' })

// querying a service operation is the same as regular querting
serviceOp1.select(function (data) { });

// ******************************
// Query String Options
// ******************************

var query = odata.from("Products");

// $orderby query option
query.orderby("Rating");
query.orderby("Rating asc");
query.orderby("Rating,Category/Name desc");

// $top query option
// argument must be >= 0
query.top(30);
query.top(1);

// $skip query option
// argument must be >= 0
query.skip(40);

// $filter query option
// http://www.odata.org/developers/protocols/uri-conventions#FilterSystemQueryOption
query.where("Price le 200 and Price gt 3.5");

// Question: should we use filter instead of where. One is closer to 
//           OData world, other resembles LINQ more closely...
query.filter("Price le 200 and Price gt 3.5");

// $expand query option
query.expand("Products");
query.expand("Products/Suppliers");
query.expand("Category,Suppliers");

// $format query option could be used to query 
// external jsonp style services where one cannot specify headers
// however, it is not exposed as an api option to the user.

// $select query option
// used to project entities, only include specified properties in entity
query.select("Price,Name");
query.select("Name,Category");


// ***********************
// Update, Delete and Insert operations
// ***********************

odata.update("resource path", object)