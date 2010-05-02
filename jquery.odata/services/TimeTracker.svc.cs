using System;
using System.Collections.Generic;
using System.Data.Services;
using System.Data.Services.Common;
using System.Linq;
using System.ServiceModel.Web;
using System.Web;

namespace jquery.odata.services
{
    public class TimeTracker : DataService<TimeTrackerContainer>
    {
        // This method is called only once to initialize service-wide policies.
        public static void InitializeService(DataServiceConfiguration config)
        {
            config.UseVerboseErrors = true;
            //config.SetEntitySetPageSize("Products", 10);
            config.DataServiceBehavior.MaxProtocolVersion = DataServiceProtocolVersion.V2;            
            config.SetEntitySetAccessRule("*", EntitySetRights.All);

            //config.SetServiceOperationAccessRule("GetProductsByColor", ServiceOperationRights.All);
            //config.SetServiceOperationAccessRule("Add", ServiceOperationRights.All);
        }
    }
}
