import { getModel } from '../config/llmModel.js'

export const pdfAgent = async(state)=>{
    try{
        const llm = await getModel("pdf");
        const prompt=`

You are an expert document writer.

Return ONLY valid JSON.

DO NOT RETURN EXPLANATIONS.

Structure:
{
"title":"",
"subtitle":"",
"sections":[
{
"heading":"",
"points":[]
}
]
Generate 4-8 sections.

Each section should have 3-6 concise bullet points.

Topic:
${state.prompt}
}
        `

        const res = await llm.invoke(prompt)

        console.log(JSON.parse(res.content))

    } catch (error){

        console.log(error)
    }
}