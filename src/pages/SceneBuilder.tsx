import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  History,
  Loader2,
  Send,
  PanelLeftClose,
  PanelRightClose,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSceneStore } from "@/store/scene-store";
import { SceneEditorPanel } from "@/components/scene/SceneEditorPanel";
import { ObjectsPanel } from "@/components/scene/ObjectsPanel";
import { VersionHistoryPanel } from "@/components/scene/VersionHistoryPanel";

type RightPanel = "properties" | "history";

export default function SceneBuilder() {
  const navigate = useNavigate();
  const [rightPanel, setRightPanel] = useState<RightPanel>("properties");
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"objects" | "preview" | "properties">("preview");
  const {
    originalPrompt,
    setOriginalPrompt,
    analyzePrompt,
    generatedPrompt,
    generatedImageUrl,
    isAnalyzing,
    isGenerating,
    generateImage,
    currentScene,
  } = useSceneStore();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b glass flex items-center px-3 md:px-4 gap-2 md:gap-3 shrink-0 z-50">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-display font-bold gradient-text hidden sm:block">PromptScene</span>

        <div className="flex-1 mx-2 md:mx-4">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <Textarea
              placeholder="Describe your scene..."
              className="resize-none h-10 min-h-[40px] text-sm bg-secondary/50 border-0 rounded-xl"
              rows={1}
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  analyzePrompt();
                }
              }}
            />
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground shrink-0 rounded-xl"
              onClick={() => analyzePrompt()}
              disabled={!originalPrompt.trim() || isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 md:mr-1" /><span className="hidden md:inline">Analyze</span></>}
            </Button>
          </div>
        </div>

        {/* Desktop panel toggles */}
        <div className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setShowLeft(!showLeft)}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
          <Button
            variant={rightPanel === "properties" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setRightPanel("properties"); setShowRight(true); }}
          >
            Properties
          </Button>
          <Button
            variant={rightPanel === "history" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setRightPanel("history"); setShowRight(true); }}
          >
            <History className="h-4 w-4 mr-1" /> History
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowRight(!showRight)}>
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-b bg-card">
        {(["objects", "preview", "properties"] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              mobilePanel === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
            onClick={() => setMobilePanel(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Objects (Desktop) */}
        {showLeft && (
          <aside className="hidden md:block w-72 border-r bg-card overflow-y-auto shrink-0">
            <ObjectsPanel />
          </aside>
        )}

        {/* Mobile panels */}
        <div className="md:hidden flex-1 overflow-y-auto">
          {mobilePanel === "objects" && <ObjectsPanel />}
          {mobilePanel === "properties" && (
            <div>
              <div className="flex border-b">
                <button
                  className={`flex-1 py-2 text-xs ${rightPanel === "properties" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  onClick={() => setRightPanel("properties")}
                >
                  Properties
                </button>
                <button
                  className={`flex-1 py-2 text-xs ${rightPanel === "history" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  onClick={() => setRightPanel("history")}
                >
                  History
                </button>
              </div>
              {rightPanel === "properties" ? <SceneEditorPanel /> : <VersionHistoryPanel />}
            </div>
          )}
          {mobilePanel === "preview" && (
            <div className="flex flex-col h-full">
              {generatedPrompt && (
                <div className="px-4 py-2 border-b bg-secondary/30">
                  <p className="text-xs text-muted-foreground mb-1 font-display">Generated Prompt</p>
                  <p className="text-sm">{generatedPrompt}</p>
                </div>
              )}
              <div className="flex-1 flex items-center justify-center p-4 scene-grid">
                <PreviewContent
                  isGenerating={isGenerating}
                  generatedImageUrl={generatedImageUrl}
                />
              </div>
              <div className="px-4 py-3 border-t bg-card flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {currentScene.objects.length} object{currentScene.objects.length !== 1 ? "s" : ""}
                </div>
                <Button
                  className="gradient-primary text-primary-foreground rounded-xl"
                  onClick={() => generateImage()}
                  disabled={isGenerating || !generatedPrompt}
                  size="sm"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Generate
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Center — Preview (Desktop) */}
        <main className="hidden md:flex flex-1 flex-col overflow-hidden">
          {generatedPrompt && (
            <div className="px-4 py-2 border-b bg-secondary/30">
              <p className="text-xs text-muted-foreground mb-1 font-display">Generated Prompt</p>
              <p className="text-sm">{generatedPrompt}</p>
            </div>
          )}
          <div className="flex-1 flex items-center justify-center p-8 scene-grid">
            <PreviewContent isGenerating={isGenerating} generatedImageUrl={generatedImageUrl} />
          </div>
          <div className="px-4 py-3 border-t bg-card flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {currentScene.objects.length} object{currentScene.objects.length !== 1 ? "s" : ""}
            </div>
            <Button
              className="gradient-primary text-primary-foreground rounded-xl"
              onClick={() => generateImage()}
              disabled={isGenerating || !generatedPrompt}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Generate Image
            </Button>
          </div>
        </main>

        {/* Right Panel (Desktop) */}
        {showRight && (
          <aside className="hidden md:block w-80 border-l bg-card overflow-y-auto shrink-0">
            {rightPanel === "properties" ? <SceneEditorPanel /> : <VersionHistoryPanel />}
          </aside>
        )}
      </div>
    </div>
  );
}

function PreviewContent({ isGenerating, generatedImageUrl }: { isGenerating: boolean; generatedImageUrl: string | null }) {
  return (
    <AnimatePresence mode="wait">
      {isGenerating ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-display">Generating image...</p>
        </motion.div>
      ) : generatedImageUrl ? (
        <motion.div key="image" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-2xl w-full">
          <img src={generatedImageUrl} alt="Generated scene" className="w-full rounded-2xl shadow-2xl border" />
        </motion.div>
      ) : (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 opacity-30">
            <ImageIcon className="h-10 w-10 text-primary-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2 text-muted-foreground">No image yet</h3>
          <p className="text-sm text-muted-foreground">
            Write a prompt and click Analyze, then edit your scene and generate an image.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
