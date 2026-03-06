import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  History,
  Loader2,
  Send,
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
      <header className="h-14 border-b glass flex items-center px-4 gap-3 shrink-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-display font-bold gradient-text">PromptScene</span>

        <div className="flex-1 mx-4">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <Textarea
              placeholder="Describe your scene... e.g. 'A photorealistic playground at sunset with a wooden swing and tall trees'"
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
              onClick={analyzePrompt}
              disabled={!originalPrompt.trim() || isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1" /> Analyze</>}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={rightPanel === "properties" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRightPanel("properties")}
          >
            Properties
          </Button>
          <Button
            variant={rightPanel === "history" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRightPanel("history")}
          >
            <History className="h-4 w-4 mr-1" /> History
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Objects */}
        <aside className="w-72 border-r bg-card overflow-y-auto shrink-0">
          <ObjectsPanel />
        </aside>

        {/* Center — Preview */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Generated Prompt Bar */}
          {generatedPrompt && (
            <div className="px-4 py-2 border-b bg-secondary/30">
              <p className="text-xs text-muted-foreground mb-1 font-display">Generated Prompt</p>
              <p className="text-sm">{generatedPrompt}</p>
            </div>
          )}

          {/* Image Preview Area */}
          <div className="flex-1 flex items-center justify-center p-8 scene-grid">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground font-display">Generating image...</p>
                </motion.div>
              ) : generatedImageUrl ? (
                <motion.div
                  key="image"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative max-w-2xl w-full"
                >
                  <img
                    src={generatedImageUrl}
                    alt="Generated scene"
                    className="w-full rounded-2xl shadow-2xl border"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center max-w-md"
                >
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 opacity-30">
                    <ImageIcon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2 text-muted-foreground">
                    No image yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Write a prompt above and click Analyze, then edit your scene and generate an image.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom action bar */}
          <div className="px-4 py-3 border-t bg-card flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {currentScene.objects.length} object{currentScene.objects.length !== 1 ? "s" : ""} in scene
            </div>
            <Button
              className="gradient-primary text-primary-foreground rounded-xl"
              onClick={generateImage}
              disabled={isGenerating || !generatedPrompt}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Generate Image
            </Button>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-80 border-l bg-card overflow-y-auto shrink-0">
          {rightPanel === "properties" ? <SceneEditorPanel /> : <VersionHistoryPanel />}
        </aside>
      </div>
    </div>
  );
}
