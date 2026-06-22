import { AvatarCard } from "genix-ui";

const App = () => {
  return (
    <div>
      <AvatarCard
        name="Sakshi Chaturvedi"
        role="Full Stack Developer"
        followers={5200}
        following={245}
        projects={18}
        bio="Creating clean, animated and reusable UI components."
        accent="#ec4899"
        bg="#09090b"
        radius="28px"
      />
    </div>
  );
};

export default App;
