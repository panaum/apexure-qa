import { Switch, Route, Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// We'll create a simple dashboard right here in this file for now
const queryClient = new QueryClient();

const Dashboard = () => (
  <div style={{ padding: '40px', backgroundColor: '#0f172a', color: 'white', minHeight: '100vh' }}>
    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>🛡️ Design Sentinel Dashboard</h1>
    <p style={{ marginTop: '10px', color: '#94a3b8' }}>Status: System Online</p>
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #3b82f6', borderRadius: '8px' }}>
      <h3 style={{ color: '#3b82f6' }}>Active Flags</h3>
      <p>🚩 Figma Sync: Connected</p>
      <p>🚩 Web Sync: Connected</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          <Route path="/" component={Dashboard} />
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}

export default App;