import { Check, ChevronLeft, ChevronRight, Code2, Copy, EyeDashed, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useState } from 'react';
import { useSelector } from "react-redux";
import { easeInOut, motion } from "motion/react"
import Editor from '@monaco-editor/react';

function Artifact() {

  const [collapsed, setCollapsed] = useState(false)

  const {artifacts} = useSelector(state=>state.message)

  const [tab, setTab] = useState("code")

  const [activeFile, setActiveFile] = useState(0)

  const [copied, setCopied] = useState(false)


  if(artifacts.length === 0) return null;

  const file = artifacts[0]?.files[activeFile]

  const htmlFile = artifacts[0]?.files?.find(f=>f.name === "index.html");

  const cssFile = artifacts[0]?.files?.find(f=>f.name==="style.css");

  const jsFile = artifacts[0]?.files?.find(f=>f.name==="script.js");

  const canPreview = Boolean(
    htmlFile && cssFile && jsFile
  );

  const previewDoc = `

    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
          ${cssFile?.content || ""}
      </style>
    </head>
    <body>
          ${htmlFile?.content || ""}
      <script>
          ${jsFile?.content || ""}
      </script>
    </body>
    </html>
  `

  const handleCopy = async () => {
    if (!file?.content) return;

    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy file:", error);
    }
  };

  const detectLanguage = (fileName="")=>{

    const name = fileName.toLowerCase()

    if (name.endsWith(".html"))
      return "html";

    if (name.endsWith(".css"))
      return "css";

    if (name.endsWith(".js"))
      return "javascript";

    if (name.endsWith(".jsx"))
      return "javascript";

    if (name.endsWith(".ts"))
      return "typescript";

    if (name.endsWith(".tsx"))
      return "typescript";

    if (name.endsWith(".json"))
      return "json";

    if (name.endsWith(".py"))
      return "python";

    if (name.endsWith(".java"))
      return "java";

    if (name.endsWith(".cpp"))
      return "cpp";

    if (name.endsWith(".c"))
      return "c";

    return "plaintext";
  }


  return (

       <motion.div
        initial={{width: 500}}
        animate={{width:collapsed?48:500}}
        transition={{
          duration:0.25,
          ease:easeInOut
        }}
      >
    <div className="hidden lg:flex h-full border-1 border-white/[0.06] flex-col overflow-hidden shrink-0">
      {!collapsed?<div className="flex flex-col h-full bg-[#000000]">
        <div className="h-14 px-4 border-b border-white/[0.06] flex items-center gap-3 shrink-0">
          <button className="flex items-center justify-center w-7 h-7 rounded-1g text-slate-500
          hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent
            border-none cursor-pointer shrink-0" onClick={()=>setCollapsed(true)}
          >
            <PanelRightClose size={18}/>
          </button>

          <div className='flex items-center gap-2 flex-1 min-w-0'>
              <div className='flex items-center justify-center w-6 h-6 rounded-md bg-orange-500/10 border border-orange-500/20 shrink-0'>
                <Code2 className='text-orange-700' size={14}/>
              </div>
              <div className='text-[15px] font-space font-medium text-slate-200 truncate'>
                {artifacts[0]?.title}
              </div>

              <div className='flex items-center gap-1 shrink-0'>
                  <button className='flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]
                    rounded-lg transition-colors duration-150 bg-transparent border-none cursor-pointer'
                    onClick={handleCopy}
                    >
                    {copied?<Check size={16}/>:<Copy size={16}/>}
                  </button>
              </div>

            {canPreview && 
               <div className='flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] p-1 rounded-lg'>
                <button className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors duration-150 cursor-pointer
                  ${tab === "code" ? "bg-linear-to-br from-orange-600 to-red-700 text-white" : "text-slate-500 hover:text-slate-200"}`} onClick={()=>setTab("code")}>
                    <Code2 size={16}/> Code
                </button>
                <button className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors duration-150 cursor-pointer
                  ${tab === "preview" ? "bg-linear-to-br from-orange-600 to-red-700 text-white" : "text-slate-500 hover:text-slate-200"}`} onClick={()=>setTab("preview")}>
                    <EyeDashed size={16}/> Preview
                </button>
              </div>
            }
            
          </div>
        </div>

        {tab==="code" && 
          <div className='h-auto flex border-b border-white/[0.06] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0'>
            {
              artifacts[0].files?.map((f,index)=>(
                  <button key={`${f.name}-${index}`} 
                    className={`px-4 py-2.5 text-[14px] font-space font-medium whitespace-nowrap transition-colors duration-150 border-r border-white/[0.05]
                  relative cursor-pointer bg-transparent ${activeFile === index ? "text-orange-600": "text-slate-500 hover:text-slate-300"}`}
                    onClick={()=>setActiveFile(index)}
                     ref={(el) => {
                        if (activeFile === index && el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                            inline: "nearest",
                          });
                        }
                      }}
                  >
                    {f.name}
                    {activeFile === index && 
                      <div className='absolute bottom-0 left-0 right-0 h-[2px]  bg-orange-600 rounded-t-full'/>
                    }
                  </button>
              ))
            }
          </div>
        }

         {tab === "code" && artifacts[0].files.length > 1 && (
        <div className="h-12 px-4 flex items-center justify-between
           bg-[#050505] shrink-0">
          
          <button
            onClick={() => setActiveFile((prev) => Math.max(0, prev - 1))}
            disabled={activeFile === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
              text-[12px] font-space text-slate-400
              hover:text-white hover:bg-white/[0.05]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
      
          <span className="text-[11px] text-slate-600 font-space">
            {activeFile + 1} / {artifacts[0].files.length}
          </span>
      
          <button
            onClick={() =>
              setActiveFile((prev) =>
                Math.min(artifacts[0].files.length - 1, prev + 1)
              )
            }
            disabled={activeFile === artifacts[0].files.length - 1}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
              text-[12px] font-space text-slate-400
              hover:text-white hover:bg-white/[0.05]
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors cursor-pointer"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

        <div className='flex-1 overflow-hidden '>
          {(tab == "preview" && canPreview)?
          <motion.div
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{duration:0.5}}
            className='w-full h-full'
          >
            <iframe title='preview' srcDoc={previewDoc} sandbox='allow-scripts' className='w-full h-full bg-white'/>
          </motion.div>
            :
          <motion.div
            initial={{opacity:0}}
            animate={{opacity:1}}
            transition={{duration:0.5}}
            className='w-full h-full'
          >

            <Editor
              theme='vs-dark'
              language={detectLanguage(file?.name)}
              value={file?.content}
              options={{ 
                  readOnly: true, 
                  minimap: { enabled: false }, 
                  fontSize: 13, 
                  wordWrap: "on", 
                  automaticLayout: true,
                  scrollBeyondLastLine: false, 
                  fontWeight: "400",
                  padding: { top: 16 }, 
                  lineNumbers: "on", 
                  renderLineHighlight: "none" ,
                  
                }}
            />

          </motion.div>
          }
        </div>
     
      </div>
        :
      <div className='hidden lg:flex h-full border-l border-orange-600/70 bg-[#000000] flex-col items-center py-4 gap-3 shrink-0'>
          <button className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500
          hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent
            border-none cursor-pointer shrink-0" onClick={()=>setCollapsed(false)}
          >
            <PanelRightOpen size={18}/>
          </button>

          <div className='flex items-center gap-2 flex-1 min-w-0'>
              <div 
                className='text-[20px] font-doto font-medium text-slate-500 tracking-widest uppercase whitespace-nowrap'
                style={{
                  writingMode:"vertical-lr",
                  transform:"rotate(180deg)"
                }}
                >
                {artifacts[0]?.title}
              </div>
          </div>
      </div>}
    </div>
    </motion.div>
  );
}

export default Artifact;
