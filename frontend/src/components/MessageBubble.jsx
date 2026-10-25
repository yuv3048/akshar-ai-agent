import Markdown from 'react-markdown'
import { Check, Copy, ExternalLink, X } from "lucide-react";
import { useState } from 'react';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function MessageBubble({role, content, images}) {

  const isUser = role === "user"

  const [lightBox, setLightBox] = useState(null)

  const [copiedCode, setCopiedCode] = useState("")

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
    
      setTimeout(() => {
        setCopiedCode("");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  const normalizeContent = (content = "") =>
    String(content).replace(/<br\s*\/?>/gi, " · ");


  return (
    <div className={`flex ${isUser? "justify-end" : "justify-start"}`}>
      <div
        style={isUser ? { backgroundImage: "linear-gradient(115deg, #dc2626 0%, #c2410c 100%)" } : undefined}
        className={`max-w-[92vw] md:max-w-[72%] px-4 py-2.5 rounded-2xl font-inter break-words overflow-hidden leading-relaxed
          ${isUser
            ? "my-2 font-inter text-white rounded-tr-sm"
            : "my-2 font-inter bg-[#000000] border border-white/[0.08] text-slate-200 rounded-tl-sm"
          }`}
      >

         {images?.length>0 && (
            <div className='flex flex-wrap gap-3 mt-4'>
              {images.map((img,i)=>(
                <img
                  key={i}
                  src={img}
                  onClick={()=>setLightBox(img)}
                  loading="lazy"
                  onError={(e)=>e.currentTarget.remove()}
                  className="w-40 h-28 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition"
                />
              ))}
            </div>
         )}


        <Markdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="font-space text-2xl font-bold mt-6 mb-3 tracking-tight">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="font-space text-xl font-semibold mt-5 mb-2 tracking-tight">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="font-space text-lg font-semibold mt-4 mb-2">
                {children}
              </h3>
            ),
            p:({children})=>(
              <p className='mb-3 whitespace-pre-wrap break-words'>{children}</p>
            ),
            ul:({children})=>(
              <ul className='list-disc pl-5 space-y-1 my-2'>{children}</ul>
            ),
            ol:({children})=>(
              <ol className='list-decimal pl-5 space-y-1 my-2'>{children}</ol>
            ),
           table: ({ children }) => (
              <div className="my-4 w-full overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full border-collapse text-left text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-white/[0.06]">
                {children}
              </thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-white/10">
                {children}
              </tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-white/[0.02]">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="border-r border-white/10 px-3 py-3 font-semibold whitespace-nowrap last:border-r-0">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-r border-white/10 px-3 py-3 align-top last:border-r-0">
                {children}
              </td>
            ),
           a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 font-medium underline inline-flex items-center gap-1"
              >
                {children}
                <ExternalLink size={14} />
              </a>
            ),
            hr: () => (
              <hr className="my-6 h-px border-0
                bg-gradient-to-r
                from-orange-500/50  to-red-700/50"
              />
            ),
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt || "AI response image"}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                onClick={() => setLightBox(src)}
                className="my-4 max-w-full max-h-[420px] rounded-xl
                  border border-white/10 object-contain cursor-zoom-in
                  hover:border-orange-500/40 transition-colors"
              />
            ),
            code:({className, children})=>{
              const value = String(children).replace(/\n$/, "")

              if(!className){
                return (
                  <code className='px-1.5 py-0.5 rounded bg-white/10 text-orange-200'>
                    {value}
                  </code>
                )
              }

              const language = className?.replace("language-","")

              return(
                <div className='my-4 overflow-hidden rounded-xl border border-white/10 bg-[#111318]'>
                    <div className='flex items-center justify-between bg-[#1b1d24] border-b border-white/10 px-4 py-2'>
                        <span className='uppercase text-xs text-slate-400'>
                          {language}
                        </span>
                        <button className='flex items-center gap-1 text-xs cursor-pointer' onClick={()=>copyCode(value)}>
                            {
                              copiedCode == value?
                              <>
                                <Check size={14}/>
                                Copied
                              </>: <> <Copy size={14}/> Copy </>
                            }
                        </button>
                    </div>


                    <SyntaxHighlighter 
                      language={language} 
                      style={oneDark}
                      wrapLongLines
                      showLineNumbers
                      customStyle={{
                        margin: 0,
                        padding: "16px",
                        background: "#0d1117",
                        fontFamily: "var(--font-code)",
                        fontSize: "12.5px",
                        lineHeight: 1.7,
                      }}
                    >
                      {value}
                    </SyntaxHighlighter>
                </div>
              )

            }



          }}
        >
          {normalizeContent(content)}
        </Markdown>

      </div>

      {lightBox && 
        <div className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 '>
          <button 
            className='absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 rounded-full p-2'
            onClick={()=>setLightBox(null)}>
              <X/>
          </button>
          <img
            src={lightBox}
            className='max-w-[90vw] max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl object-contain'
          />
        </div>}
    </div>
  )
}

export default MessageBubble