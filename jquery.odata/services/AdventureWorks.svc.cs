using System;
using System.Collections.Generic;
using System.Data.Services;
using System.Data.Services.Common;
using System.Linq;
using System.ServiceModel.Web;
using System.Web;

namespace jquery.odata.services
{
    public class AdventureWorks : DataService<AdventureWorksLT2008Entities>
    {
        // This method is called only once to initialize service-wide policies.
        public static void InitializeService(DataServiceConfiguration config)
        {
            config.UseVerboseErrors = true;
            //config.SetEntitySetPageSize("Products", 10);
            config.DataServiceBehavior.MaxProtocolVersion = DataServiceProtocolVersion.V2;

            config.SetServiceOperationAccessRule("GetProductsByColor", ServiceOperationRights.All);
            config.SetServiceOperationAccessRule("Add", ServiceOperationRights.All);
            config.SetEntitySetAccessRule("*", EntitySetRights.All);            
        }

        [WebGet]
        public IQueryable<Product> GetProductsByColor(string color)
        {
            if (string.IsNullOrEmpty(color))
            {
                throw new ArgumentNullException("color", "You must provide a value for the parameter'color'.");
            }

            // Get the ObjectContext that is the data source for the service.
            AdventureWorksLT2008Entities context = this.CurrentDataSource;

            try
            {

                var products = from prod in context.Products
                               where prod.Color == color
                               select prod;

                return products;
            }
            catch (Exception ex)
            {
                throw new ApplicationException("An error occured: {0}", ex);
            }
        }

        [WebGet]
        public int Add(int start)
        {
            return start*2;
        }

    }
}
