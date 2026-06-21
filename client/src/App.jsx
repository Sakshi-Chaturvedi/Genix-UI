import { BackgroundImageSlider } from "genix-ui";

const App = () => {
  return (
    <div>
      <BackgroundImageSlider
        height="600px"
        radius="24px"
        autoPlay={true}
        autoPlayInterval={3000}
      />
    </div>
  );
};

export default App;
