import { Check, ChevronLeft, ChevronRight, Code2, Copy, EyeDashed, PanelRightClose, PanelRightOpen, X } from 'lucide-react'
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { clearArtifacts } from "../redux/messageSlice";
import { easeInOut, motion } from "motion/react"
import Editor from '@monaco-editor/react';

function Artifact() {

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const {artifacts} = useSelector(state=>state.message)
  const dispatch = useDispatch()

  const handleRemoveArtifact = () => {
    setMobileOpen(false)
    dispatch(clearArtifacts())
  }

  const [tab, setTab] = useState("code")

  const [activeFile, setActiveFile] = useState(0)

  const [copied, setCopied] = useState(false)


  useEffect(() => {
    setMobileOpen(false);
    setActiveFile(0);
    setTab("code");
  }, [artifacts[0]?.id]);

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
    <>
      {/* Mobile artifact launcher: stays closed after generation to keep chat visible. */}
      <div className="lg:hidden">
        {!mobileOpen && (
          <aside className="fixed right-0 top-0 z-40 flex h-[100dvh] w-12 flex-col items-center gap-4 overflow-hidden border-l border-[#1F0F05] bg-[#000000] py-4 shadow-xl shadow-black/30">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open artifact" title="Open artifact" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-orange-400"><PanelRightOpen size={18} /></button>
            <span className="min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-[20px] font-doto font-medium uppercase tracking-widest text-slate-500 [writing-mode:vertical-lr] rotate-180" title={artifacts[0]?.title}>{artifacts[0]?.title}</span>
            <button type="button" onClick={handleRemoveArtifact} aria-label="Remove artifact" title="Remove artifact" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"><X size={16} /></button>
          </aside>
        )}

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-[#000000] text-white">
            <header className="flex min-h-14 items-center gap-2 border-b border-white/10 px-3">
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Collapse artifact" title="Collapse artifact" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><PanelRightClose size={19} /></button>
              <Code2 size={17} className="shrink-0 text-orange-400" />
              <h2 className="min-w-0 flex-1 truncate text-sm font-medium">{artifacts[0]?.title}</h2>
              <button type="button" onClick={handleCopy} aria-label="Copy current file" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10">
                {copied ? <Check size={17} /> : <Copy size={17} />}
              </button>
              <button type="button" onClick={handleRemoveArtifact} aria-label="Remove artifact" title="Remove artifact" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400"><X size={18} /></button>
            </header>

            {tab === "code" && (
              <div className="flex shrink-0 overflow-x-auto border-b border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {artifacts[0].files?.map((f, index) => (
                  <button key={`${f.name}-mobile-${index}`} type="button" onClick={() => setActiveFile(index)} className={`relative shrink-0 border-r border-white/5 px-3 py-3 text-xs ${activeFile === index ? "text-orange-400" : "text-slate-400"}`}>
                    {f.name}
                    {activeFile === index && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-500" />}
                  </button>
                ))}
              </div>
            )}

            <main className="min-h-0 flex-1 overflow-hidden">
              {tab === "preview" && canPreview ? (
                <iframe title="Artifact preview" srcDoc={previewDoc} sandbox="allow-scripts" className="h-full w-full border-0 bg-white" />
              ) : (
                <Editor theme="vs-dark" language={detectLanguage(file?.name)} value={file?.content ?? ""} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, wordWrap: "on", automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 12 }, lineNumbers: "on", renderLineHighlight: "none" }} />
              )}
            </main>

            <footer className="flex shrink-0 flex-col gap-3 border-t border-white/10 bg-[#080808] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setActiveFile((prev) => Math.max(0, prev - 1))} disabled={activeFile === 0 || tab === "preview"} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-30">
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="text-xs text-slate-500">{activeFile + 1} / {artifacts[0].files.length}</span>
                <button type="button" onClick={() => setActiveFile((prev) => Math.min(artifacts[0].files.length - 1, prev + 1))} disabled={activeFile === artifacts[0].files.length - 1 || tab === "preview"} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-30">
                  Next <ChevronRight size={16} />
                </button>
              </div>
              {canPreview && (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setTab("code")} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${tab === "code" ? "border-orange-500/40 bg-orange-500/15 text-white" : "border-white/10 text-slate-400"}`}><Code2 size={16} /> Code</button>
                  <button type="button" onClick={() => setTab("preview")} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${tab === "preview" ? "border-orange-500/40 bg-orange-500/15 text-white" : "border-white/10 text-slate-400"}`}><EyeDashed size={16} /> Preview</button>
                </div>
              )}
            </footer>
          </div>
        )}
      </div>

       <motion.div
        className="hidden h-full min-h-0 shrink-0 lg:block"
        initial={{width: 500}}
        animate={{width:collapsed?48:500}}
        transition={{
          duration:0.25,
          ease:easeInOut
        }}
      >
    <div className="flex h-full min-h-0 w-full border border-white/[0.06] flex-col overflow-hidden shrink-0">
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
                  <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 bg-transparent border-none cursor-pointer' onClick={handleRemoveArtifact} aria-label="Remove artifact" title="Remove artifact"><X size={17}/></button>
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



        <div className='min-h-0 flex-1 overflow-hidden'>
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
        {tab === "code" && artifacts[0].files.length > 1 && (
          <footer className="h-12 px-4 flex items-center justify-between border-t border-white/[0.06] bg-[#050505] shrink-0">
            <button onClick={() => setActiveFile((prev) => Math.max(0, prev - 1))} disabled={activeFile === 0} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-space text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="text-[11px] text-slate-600 font-space">{activeFile + 1} / {artifacts[0].files.length}</span>
            <button onClick={() => setActiveFile((prev) => Math.min(artifacts[0].files.length - 1, prev + 1))} disabled={activeFile === artifacts[0].files.length - 1} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-space text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
              Next <ChevronRight size={16} />
            </button>
          </footer>
        )}
      </div>
        :
      <div className='hidden lg:flex h-full border-l border-[#1F0F05] bg-[#000000] flex-col items-center py-4 gap-4 shrink-0'>
          <button className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer shrink-0" onClick={()=>setCollapsed(false)} aria-label="Expand artifact" title="Expand artifact">
            <PanelRightOpen size={18}/>
          </button>
          <div className='flex flex-1 min-h-0 items-center justify-center overflow-hidden'>
            <div className='text-[20px] font-doto font-medium text-slate-500 tracking-widest uppercase whitespace-nowrap' style={{ writingMode:"vertical-lr", transform:"rotate(180deg)" }} title={artifacts[0]?.title}>
              {artifacts[0]?.title}
            </div>
          </div>
          <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400" onClick={handleRemoveArtifact} aria-label="Remove artifact" title="Remove artifact">
            <X size={16}/>
          </button>
      </div>}
    </div>
    </motion.div>
    </>
  );
}

export default Artifact;
