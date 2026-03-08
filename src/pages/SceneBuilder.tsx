import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, Sparkles, Image as ImageIcon, Loader2, Send,
  PanelLeftClose, PanelRightClose, Save, Clock,
  Layers, Layout, Zap, Undo2, Redo2, Grid3X3, Magnet,
  ZoomIn, ZoomOut, RotateCcw, Plus, Hand, MousePointer,
  PenTool, Square, Circle, Minus, Pipette, Download,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSceneStore } from "@/store/scene-store";
import { useEditorStore, EditorTool } from "@/store/editor-store";
import { EditorLeftSidebar } from "@/components/editor/EditorLeftSidebar";
import { EditorRightInspector } from "@/components/editor/EditorRightInspector";
import { WorkspaceCanvas } from "@/components/editor/WorkspaceCanvas";
import { VersionHistoryPanel } from "@/components/scene/VersionHistoryPanel";
import { ExportDialog } from "@/components/editor/ExportDialog";
import { PlanUsageBadge } from "@/components/PlanUsageBadge";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GENERATION_MODES, getModesForPlan } from "@/lib/providers";
import { ARTBOARD_PRESETS } from "@/lib/artboard-presets";
import { validateModeAccess, calculateJobCost } from "@/lib/generation-engine";
import type { GenerationMode } from "@/lib/providers";

type RightPanel = "inspector" | "history";

const MODE_ICONS: Record<GenerationMode, typeof ImageIcon> = {
  scene: ImageIcon,
  ad_composition: Layout,
  advanced_layered: Layers,
};

// Tool definitions for the toolbar
const DRAWING_TOOLS: { id: EditorTool; icon: typeof Square; label: string; shortcut?: string }[] = [
  { id: "select", icon: MousePointer, label: "Select", shortcut: "V" },
  { id: "hand", icon: Hand, label: "Hand", shortcut: "H" },
  { id: "rectangle", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "ellipse", icon: Circle, label: "Ellipse", shortcut: "O" },
  { id: "line", icon: Minus, label: "Line", shortcut: "L" },
  { id: "pen", icon: PenTool, label: "Pen", shortcut: "P" },
  { id: "color_picker", icon: Pipette, label: "Color Picker", shortcut: "I" },
];

export default function SceneBuilder() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [rightPanel, setRightPanel] = useState<RightPanel>("inspector");
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [addArtboardOpen, setAddArtboardOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [artboardPreset, setArtboardPreset] = useState("ig-post");
  const [artboardName, setArtboardName] = useState("Artboard 1");
  const [artboardW, setArtboardW] = useState(1024);
  const [artboardH, setArtboardH] = useState(1024);

  useEditorShortcuts();

  const {
    originalPrompt, setOriginalPrompt, analyzePrompt, isAnalyzing, isGenerating,
    currentScene, isDirty, generatedPrompt, generatedImageUrl,
    generationMode, setGenerationMode, selectedResolution, setSelectedResolution,
    selectedProvider, selectedModel, generateImage, saveVersion,
    loadProjectScene, loadVersionsFromDB, setCurrentProjectId,
  } = useSceneStore();

  const {
    canvasZoom, undoStack, redoStack, undo, redo, snapEnabled, showGrid,
    toggleSnap, toggleGrid, zoomIn, zoomOut, resetView, activeTool, setActiveTool, spaceHeld,
    activeColor, setActiveColor, activeStroke, setActiveStroke,
  } = useEditorStore();
  const { canGenerate, consumeCredits, plan, workspaceId } = usePlan();
  const { activeWorkspace, userRole } = useWorkspace();
  const isViewerOnly = activeWorkspace?.type === "team" && userRole === "viewer";
  const availableModes = getModesForPlan(plan);

  // Auto-save with debounce
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isDirty && projectId) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveVersion("Auto-save");
      }, 5000);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [isDirty, currentScene]);

  useEffect(() => {
    if (!projectId) { navigate("/dashboard"); return; }
    setCurrentProjectId(projectId);
    loadProjectScene(projectId);
    loadVersionsFromDB(projectId);
    supabase.from("projects").select("name").eq("id", projectId).single().then(({ data }) => {
      if (data) setProjectName(data.name);
      else navigate("/dashboard");
    });
  }, [projectId]);

  // Keyboard shortcuts for tools
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === "r") setActiveTool("rectangle");
      if (key === "o") setActiveTool("ellipse");
      if (key === "l") setActiveTool("line");
      if (key === "p") setActiveTool("pen");
      if (key === "i") setActiveTool("color_picker");
      if (key === "h") setActiveTool("hand");
      if (key === "v") setActiveTool("select");
      if (key === "t") {
        // Quick add text
        useSceneStore.getState().addObject({
          type: "text", objectType: "text", textContent: "Edit me",
          x: 100, y: 100, width: 200, height: 40, fontSize: 16,
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleGenerate = async () => {
    if (!canGenerate()) {
      toast.error(plan === "free" ? "No free uses remaining today" : "Insufficient credits");
      return;
    }
    const access = validateModeAccess(plan, generationMode);
    if (!access.allowed) { toast.error(access.reason); return; }

    const estimatedCost = calculateJobCost({
      mode: generationMode, provider: selectedProvider, model: selectedModel,
      resolution: selectedResolution, plan, layeredGeneration: generationMode === "advanced_layered",
    });

    generateImage(plan, workspaceId || undefined);

    if (plan === "free") {
      await consumeCredits(0, "Free daily generation");
    } else {
      await consumeCredits(estimatedCost, `${generationMode} generation`);
    }
  };

  const handleAddArtboard = useCallback(() => {
    setAddArtboardOpen(true);
  }, []);

  const createArtboard = async () => {
    if (!projectId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from("artboards").insert({
      project_id: projectId,
      user_id: user.id,
      name: artboardName,
      width: artboardW,
      height: artboardH,
      preset_size: artboardPreset,
      background_color: "#ffffff",
      scene_json: { ...currentScene, objects: [] } as any,
    }).select().single();

    if (error) { toast.error(error.message); return; }
    toast.success(`Artboard "${artboardName}" created`);
    setAddArtboardOpen(false);
  };

  const handlePresetChange = (presetId: string) => {
    setArtboardPreset(presetId);
    const preset = ARTBOARD_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== "custom") {
      setArtboardW(preset.width);
      setArtboardH(preset.height);
      setArtboardName(preset.name);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ─── Top Command Bar ───────────────────────────────────── */}
      <header className="h-11 border-b bg-card/90 backdrop-blur-sm flex items-center px-2 gap-1.5 shrink-0 z-50">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="font-display text-xs font-semibold gradient-text">PS</span>
          <span className="text-muted-foreground text-[10px]">/</span>
          <span className="text-[11px] font-medium truncate max-w-[100px]">{projectName}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-warning" title="Unsaved" />}
        </div>

        <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block" />

        {/* Center: Prompt */}
        <div className="flex-1 mx-1 max-w-lg">
          <div className="flex items-center gap-1">
            <Textarea
              placeholder="Describe your scene..."
              className="resize-none h-7 min-h-[28px] text-[11px] bg-secondary/50 border-0 rounded-md py-1 px-2"
              rows={1}
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyzePrompt(); } }}
            />
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground shrink-0 h-7 text-[11px] rounded-md px-2"
              onClick={() => analyzePrompt()}
              disabled={!originalPrompt.trim() || isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <Separator orientation="vertical" className="h-5 mx-1 hidden md:block" />

        {/* Right: Tools */}
        <TooltipProvider delayDuration={300}>
          <div className="hidden md:flex items-center gap-0.5">
            {/* Drawing tools */}
            {DRAWING_TOOLS.map(tool => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === tool.id && !spaceHeld ? "secondary" : "ghost"}
                    size="icon" className="h-7 w-7"
                    onClick={() => setActiveTool(tool.id)}
                  >
                    <tool.icon className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[10px]">{tool.label} ({tool.shortcut})</TooltipContent>
              </Tooltip>
            ))}

            <Separator orientation="vertical" className="h-4 mx-0.5" />

            {/* Color swatches */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative h-7 w-7 flex items-center justify-center">
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => setActiveColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: activeColor }} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-[10px]">Fill color</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative h-7 w-7 flex items-center justify-center">
                  <input
                    type="color"
                    value={activeStroke}
                    onChange={(e) => setActiveStroke(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-4 h-4 rounded-sm border-2" style={{ borderColor: activeStroke, backgroundColor: "transparent" }} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-[10px]">Stroke color</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-4 mx-0.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={undoStack.length === 0}>
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px]">Undo (⌘Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={redoStack.length === 0}>
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px]">Redo (⌘⇧Z)</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-4 mx-0.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={snapEnabled ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={toggleSnap}>
                  <Magnet className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px]">Snap to grid</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={showGrid ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={toggleGrid}>
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px]">Toggle grid</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-4 mx-0.5" />

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
            <span className="text-[10px] text-muted-foreground w-8 text-center tabular-nums">{Math.round(canvasZoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}><RotateCcw className="h-3 w-3" /></Button>

            <Separator orientation="vertical" className="h-4 mx-0.5" />

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowLeft(!showLeft)}>
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={rightPanel === "inspector" && showRight ? "secondary" : "ghost"}
              size="sm" className="h-7 text-[10px] px-2"
              onClick={() => { setRightPanel("inspector"); setShowRight(true); }}
            >
              Inspector
            </Button>
            <Button
              variant={rightPanel === "history" && showRight ? "secondary" : "ghost"}
              size="sm" className="h-7 text-[10px] px-2"
              onClick={() => { setRightPanel("history"); setShowRight(true); }}
            >
              <Clock className="h-3 w-3 mr-0.5" /> History
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRight(!showRight)}>
              <PanelRightClose className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TooltipProvider>
      </header>

      {/* ─── Main Layout ──────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {showLeft && (
          <aside className="w-56 border-r bg-card/50 overflow-y-auto shrink-0 hidden md:block">
            <EditorLeftSidebar onAddArtboard={handleAddArtboard} projectId={projectId} />
          </aside>
        )}

        <main className="flex-1 flex flex-col overflow-hidden">
          <WorkspaceCanvas
            artboardWidth={artboardW}
            artboardHeight={artboardH}
            artboardBg="#ffffff"
            generatedImageUrl={generatedImageUrl}
          />

          {/* Bottom Generation Bar */}
          <div className="px-3 py-2 border-t bg-card/90 backdrop-blur-sm flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => saveVersion()} disabled={!isDirty}>
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>

              <Select value={generationMode} onValueChange={(v) => setGenerationMode(v as GenerationMode)}>
                <SelectTrigger className="h-7 w-[130px] text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENERATION_MODES.map((mode) => {
                    const available = availableModes.some(m => m.id === mode.id);
                    const Icon = MODE_ICONS[mode.id];
                    return (
                      <SelectItem key={mode.id} value={mode.id} disabled={!available}>
                        <span className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {mode.name}
                          {!available && <span className="text-[8px] text-muted-foreground">↑</span>}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedResolution} onValueChange={(v) => setSelectedResolution(v as any)}>
                <SelectTrigger className="h-7 w-[70px] text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p</SelectItem>
                  <SelectItem value="1080p">1080p</SelectItem>
                  <SelectItem value="2k" disabled={!["pro", "ultra", "team"].includes(plan)}>2K</SelectItem>
                  <SelectItem value="4k" disabled={!["ultra", "team"].includes(plan)}>4K</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <PlanUsageBadge />

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setExportOpen(true)}
              >
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>

              <Button
                className="gradient-primary text-primary-foreground h-7 text-[11px] rounded-md px-3"
                onClick={handleGenerate}
                disabled={isGenerating || !generatedPrompt || !canGenerate() || isViewerOnly}
                size="sm"
              >
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                Generate
              </Button>
            </div>
          </div>
        </main>

        {showRight && (
          <aside className="w-64 border-l bg-card/50 overflow-y-auto shrink-0 hidden md:block">
            {rightPanel === "inspector" ? <EditorRightInspector /> : <VersionHistoryPanel />}
          </aside>
        )}
      </div>

      {/* Add Artboard Dialog */}
      <Dialog open={addArtboardOpen} onOpenChange={setAddArtboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">New Artboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={artboardName} onChange={(e) => setArtboardName(e.target.value)} className="h-8 text-xs mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Preset</label>
              <Select value={artboardPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ARTBOARD_PRESETS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.width}×{p.height})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Width</label>
                <Input type="number" value={artboardW} onChange={(e) => setArtboardW(Number(e.target.value))} className="h-8 text-xs mt-0.5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Height</label>
                <Input type="number" value={artboardH} onChange={(e) => setArtboardH(Number(e.target.value))} className="h-8 text-xs mt-0.5" />
              </div>
            </div>
            <Button className="w-full gradient-primary text-primary-foreground text-xs" onClick={createArtboard}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Artboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        artboardWidth={artboardW}
        artboardHeight={artboardH}
        generatedImageUrl={generatedImageUrl}
      />
    </div>
  );
}
