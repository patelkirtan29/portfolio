import ScrollProvider from "@/components/ScrollProvider";
import Nav from "@/components/Nav";
import Lobby from "@/components/rooms/Lobby";
import Practice from "@/components/rooms/Practice";
import Gallery from "@/components/rooms/Gallery";
import Signal from "@/components/rooms/Signal";

export default function Home() {
  return (
    <ScrollProvider>
      <Nav />
      <Lobby />
      <Practice />
      <Gallery />
      <Signal />
    </ScrollProvider>
  );
}
