import { Charts } from "genix-ui";

function App() {
  return (
    <Charts
      type="line"
      title="Revenue"
      accent="#6366f1"
      data={[
        { label: "Jan", value: 40 },
        { label: "Feb", value: 70 },
        { label: "Mar", value: 55 },
        { label: "Apr", value: 90 },
      ]}
    />
  );
}

export default App;
