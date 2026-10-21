import { useEffect, useState } from "react";
import Home from "./pages/Home";
import getCurrentUser from "./features/getCurrentUser";
import { setUserdata } from "./redux/userSlice";
import { useDispatch } from "react-redux";

function App() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    const restoreSession = async () => {
      try {
        const user = await getCurrentUser();
        dispatch(setUserdata(user));
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [dispatch]);

  if (loading) {
    return (
      <div className="h-screen bg-[#000000] flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return <Home />;
}

export default App;

