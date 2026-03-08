import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Send,
  PanelLeftClose,
  PanelRightClose,
  Save,
  Clock,
  FileJson,
  FileText,
  Info,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSceneStore } from "@/store/scene-store";
import { SceneEditorPanel } from "@/components/scene/SceneEditorPanel";
import { ObjectsPanel } from "@/components/scene/ObjectsPanel";
import { VersionHistoryPanel } from "@/components/scene/VersionHistoryPanel";
import { PlanUsageBadge } from "@/components/PlanUsageBadge";
import { usePlan } from "@/hooks/use-plan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RightPanel = "inspector" | "history";

export default function SceneBuilder() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [rightPanel, setRightPanel] = useState<RightPanel>("inspector");
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"layers" | "preview" | "inspector">("preview");
  const [projectName, setProjectName] = useState("");

  const {
    originalPrompt,
    setOriginalPrompt,
    analyzePrompt,
    isAnalyzing,
    currentScene,
    isDirty,
    previewTab,
    setPreviewTab,
    loadProjectScene,
    loadVersionsFromDB,
    setCurrentProjectId,
  } = useSceneStore();

  useEffect(() => {
    if (!projectId) {
      navigate("/dashboard");
      return;
    }
    setCurrentProjectId(projectId);
    loadProjectScene(projectId);
    loadVersionsFromDB(projectId);

    // Load project name
    supabase.from("projects").select("name").eq("id", projectId).single().then(({ data }) => {
      if (data) setProjectName(data.name);
      else navigate("/dashboard");
    });
  }, [projectId]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Command Bar */}
      <header className="h-12 border-b bg-card/80 backdrop-blur-sm flex items-center px-3 gap-2 shrink-0 z-50">
        <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="hidden sm:flex items-center gap-1.5">
          <span className="font-display text-xs font-semibold gradient-text">PS</span>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="text-xs font-medium truncate max-w-[120px]">{projectName}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-warning" title="Unsaved changes" />}
        </div>

        <div className="flex-1 mx-2">
          <div className="flex items-center gap-1.5 max-w-xl mx-auto">
            <Textarea
              placeholder="Describe your scene..."
              className="resize-none h-8 min-h-[32px] text-xs bg-secondary/50 border-0 rounded-lg py-1.5"
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
              className="gradient-primary text-primary-foreground shrink-0 h-8 text-xs rounded-lg"
              onClick={() => analyzePrompt()}
              disabled={!originalPrompt.trim() || isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5 md:mr-1" /><span className="hidden md:inline">Analyze</span></>}
            </Button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowLeft(!showLeft)}>
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={rightPanel === "inspector" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { setRightPanel("inspector"); setShowRight(true); }}
          >
            Inspector
          </Button>
          <Button
            variant={rightPanel === "history" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { setRightPanel("history"); setShowRight(true); }}
          >
            <Clock className="h-3 w-3 mr-1" /> History
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRight(!showRight)}>
            <PanelRightClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-b bg-card">
        {(["layers", "preview", "inspector"] as const).map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 text-[11px] font-medium capitalize transition-colors ${
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
        {/* Left — Layers Panel */}
        {showLeft && (
          <aside className="hidden md:block w-64 border-r bg-card overflow-y-auto shrink-0">
            <ObjectsPanel />
          </aside>
        )}

        {/* Mobile panels */}
        <div className="md:hidden flex-1 overflow-y-auto">
          {mobilePanel === "layers" && <ObjectsPanel />}
          {mobilePanel === "inspector" && (
            <div>
              <div className="flex border-b">
                <button
                  className={`flex-1 py-2 text-[11px] ${rightPanel === "inspector" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  onClick={() => setRightPanel("inspector")}
                >
                  Inspector
                </button>
                <button
                  className={`flex-1 py-2 text-[11px] ${rightPanel === "history" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
                  onClick={() => setRightPanel("history")}
                >
                  History
                </button>
              </div>
              {rightPanel === "inspector" ? <SceneEditorPanel /> : <VersionHistoryPanel />}
            </div>
          )}
          {mobilePanel === "preview" && (
            <div className="flex flex-col h-full">
              <PreviewArea />
              <BottomBar />
            </div>
          )}
        </div>

        {/* Center — Preview Workspace */}
        <main className="hidden md:flex flex-1 flex-col overflow-hidden">
          {/* Preview tabs */}
          <div className="border-b bg-card/50 px-4 py-1.5 flex items-center justify-between">
            <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)}>
              <TabsList className="h-7 bg-secondary/50">
                <TabsTrigger value="image" className="text-[11px] h-6 px-2.5"><ImageIcon className="h-3 w-3 mr-1" />Image</TabsTrigger>
                <TabsTrigger value="prompt" className="text-[11px] h-6 px-2.5"><FileText className="h-3 w-3 mr-1" />Prompt</TabsTrigger>
                <TabsTrigger value="json" className="text-[11px] h-6 px-2.5"><FileJson className="h-3 w-3 mr-1" />JSON</TabsTrigger>
                <TabsTrigger value="metadata" className="text-[11px] h-6 px-2.5"><Info className="h-3 w-3 mr-1" />Meta</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">
                {currentScene.objects.length} object{currentScene.objects.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <PreviewArea />
          <BottomBar />
        </main>

        {/* Right — Inspector / History */}
        {showRight && (
          <aside className="hidden md:block w-72 border-l bg-card overflow-y-auto shrink-0">
            {rightPanel === "inspector" ? <SceneEditorPanel /> : <VersionHistoryPanel />}
          </aside>
        )}
      </div>
    </div>
  );
}

function PreviewArea() {
  const { isGenerating, generatedImageUrl, generatedPrompt, currentScene, previewTab } = useSceneStore();

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-auto scene-grid">
      <AnimatePresence mode="wait">
        {previewTab === "image" && (
          isGenerating ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Generating...</p>
            </motion.div>
          ) : generatedImageUrl ? (
            <motion.div key="image" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-2xl w-full">
              <img src={generatedImageUrl} alt="Generated scene" className="w-full rounded-xl shadow-lg border" />
            </motion.div>
          ) : (
            <EmptyPreview />
          )
        )}
        {previewTab === "prompt" && (
          <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl w-full">
            <div className="rounded-xl border bg-card p-5">
              <h4 className="font-display text-xs font-semibold mb-2 text-muted-foreground">Generated Prompt</h4>
              <p className="text-sm leading-relaxed">{generatedPrompt || "No prompt generated yet. Analyze a scene description to begin."}</p>
            </div>
          </motion.div>
        )}
        {previewTab === "json" && (
          <motion.div key="json" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl w-full max-h-full overflow-auto">
            <pre className="rounded-xl border bg-card p-5 text-xs font-mono whitespace-pre-wrap text-muted-foreground">
              {JSON.stringify(currentScene, null, 2)}
            </pre>
          </motion.div>
        )}
        {previewTab === "metadata" && (
          <motion.div key="meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full">
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <h4 className="font-display text-xs font-semibold text-muted-foreground">Scene Metadata</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Title:</span> {currentScene.scene_title || "—"}</div>
                <div><span className="text-muted-foreground">Style:</span> {currentScene.style.visual_style}</div>
                <div><span className="text-muted-foreground">Objects:</span> {currentScene.objects.length}</div>
                <div><span className="text-muted-foreground">Quality:</span> {currentScene.style.quality}</div>
                <div><span className="text-muted-foreground">Location:</span> {currentScene.environment.location || "—"}</div>
                <div><span className="text-muted-foreground">Camera:</span> {currentScene.camera.shot_type} / {currentScene.camera.lens}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyPreview() {
  return (
    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-xs">
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
        <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <h3 className="font-display text-sm font-semibold mb-1 text-muted-foreground">No image yet</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Describe a scene above, analyze it, then generate an image.
      </p>
    </motion.div>
  );
}

function BottomBar() {
  const { isGenerating, generatedPrompt, generateImage, saveVersion, isDirty } = useSceneStore();
  const { canGenerate, consumeCredits, plan, dailyUsesRemaining, creditBalance } = usePlan();

  const handleGenerate = async () => {
    if (!canGenerate()) {
      toast.error(plan === "free" ? "No free uses remaining today" : "Insufficient credits");
      return;
    }
    generateImage();
    // Consume credits after triggering (the store handles the actual generation)
    const cost = plan === "free" ? 0 : 100; // base scene mode cost
    if (cost > 0) {
      await consumeCredits(cost, "Scene generation");
    } else {
      // Free plan: just track daily usage
      await consumeCredits(0, "Free daily generation");
    }
  };

  return (
    <div className="px-4 py-2.5 border-t bg-card flex items-center justify-between">
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => saveVersion()}
        disabled={!isDirty}
      >
        <Save className="h-3 w-3 mr-1" /> Save
      </Button>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">
          {plan === "free" ? `${dailyUsesRemaining} uses left` : `${creditBalance.toLocaleString()} credits`}
        </span>
        <Button
          className="gradient-primary text-primary-foreground h-8 text-xs rounded-lg"
          onClick={handleGenerate}
          disabled={isGenerating || !generatedPrompt || !canGenerate()}
          size="sm"
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
          Generate
        </Button>
      </div>
    </div>
  );
}
