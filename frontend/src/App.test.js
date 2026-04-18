import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders updated operations heading", () => {
  render(<App />);
  expect(screen.getByText(/realtime field intelligence/i)).toBeInTheDocument();
});
