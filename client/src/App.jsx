import { AnimatedForm } from "genix-ui";

const App = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",
        padding: "24px",
      }}
    >
      <AnimatedForm
        title="Let’s Talk"
        description="Have an idea? Send a message and let's build something."
        submitText="Submit"
        accent="#111827"
        onSubmit={(values) => console.log(values)}
      />
    </div>
  );
};

export default App;
