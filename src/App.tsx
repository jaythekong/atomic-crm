import { CRM } from "@/components/atomic-crm/root/CRM";
import { getDataProvider } from "@/components/atomic-crm/providers/worker/dataProvider";
import { getAuthProvider } from "@/components/atomic-crm/providers/worker/authProvider";

// Instantiate once at module level so the same instance is
// reused across re-renders (avoids React Admin provider resets)
const dataProvider = getDataProvider();
const authProvider = getAuthProvider();

const App = () => (
  <CRM
    dataProvider={dataProvider as any}
    authProvider={authProvider}
    title="DaloCRM"
    disableTelemetry
  />
);

export default App;
