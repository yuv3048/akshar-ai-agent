import { createSlice } from "@reduxjs/toolkit"

const messageSlice = createSlice({
    name:"message",
    initialState:{
        messages: [],
        artifacts: []
    },
    reducers:{
       setMessages:(state, action)=>{
        state.messages = action.payload
       },
       addMessage:(state, action)=>{
        state.messages.push(action.payload)
       },
       setArtifacts:(state, action)=>{
        state.artifacts = action.payload
       },
       clearArtifacts:(state)=>{
        state.artifacts = []
       }
    }
})

export const { setMessages, addMessage, setArtifacts, clearArtifacts } = messageSlice.actions
export default messageSlice.reducer