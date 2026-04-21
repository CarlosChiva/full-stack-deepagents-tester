import { ChatProvider } from "@/context";
import MainLayout from "@/ui/Layout/MainLayout";
import "./App.css";

function App() {
  return (
    <ChatProvider>
      <MainLayout />
    </ChatProvider>
  );
}

export default App;
