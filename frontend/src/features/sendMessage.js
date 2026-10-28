import api from "../../utils/axios";

async function sendMessage(payload) {
  const { file, ...fields } = payload ?? {};
  const body = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      body.append(key, typeof value === "boolean" ? String(value) : String(value));
    }
  });

  if (file) body.append("file", file);

  const { data } = await api.post("/api/agent/chat", body);
  return data;
}

export default sendMessage;
