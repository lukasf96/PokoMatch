import { BrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import AppRouter from "./router/AppRouter";
import { DocumentTitle } from "./router/DocumentTitle";

export default function App() {
  return (
    <BrowserRouter>
      <DocumentTitle />
      <Layout>
        <AppRouter />
      </Layout>
    </BrowserRouter>
  );
}
