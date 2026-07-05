export default interface Friend {
  id: number;
  username: string;
  displayName: string;
  status: string;
  direction: "incoming" | "outgoing";
}
