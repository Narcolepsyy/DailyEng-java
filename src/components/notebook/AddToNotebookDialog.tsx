"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getNotebooks, createNotebook, createNotebookItem, NotebookData } from "@/actions/notebook"
import { BookPlus, Plus, Loader2, Check } from "lucide-react"

export type NotebookItemPayload = {
    word: string;
    pronunciation?: string;
    meaning: string[];
    vietnamese: string[];
    examples: { en: string; vi: string }[];
    partOfSpeech?: string;
    level?: string;
    note?: string;
    tags?: string[];
}

interface AddToNotebookDialogProps {
    type: "vocabulary" | "grammar"
    itemPayload?: NotebookItemPayload
    itemPayloads?: NotebookItemPayload[] // For bulk saving
    defaultNotebookName?: string
    children?: React.ReactNode
}

export function AddToNotebookDialog({ type, itemPayload, itemPayloads, defaultNotebookName, children }: AddToNotebookDialogProps) {
    const [open, setOpen] = useState(false)
    const [notebooks, setNotebooks] = useState<NotebookData[]>([])
    const [selectedNotebookId, setSelectedNotebookId] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    
    const [isCreatingNew, setIsCreatingNew] = useState(!!itemPayloads) // Default to creating new if bulk
    const [newNotebookName, setNewNotebookName] = useState(defaultNotebookName || "")
    
    // For UI feedback
    const [saved, setSaved] = useState(false)

    const payloads = itemPayloads || (itemPayload ? [itemPayload] : [])

    useEffect(() => {
        if (open && !saved) {
            loadNotebooks()
            if (defaultNotebookName) {
                setNewNotebookName(defaultNotebookName)
            }
        }
    }, [open])

    // Reset saved state if the payload changes while open
    useEffect(() => {
        setSaved(false)
    }, [itemPayload?.word, itemPayloads])

    const loadNotebooks = async () => {
        setIsLoading(true)
        try {
            const allNotebooks = await getNotebooks()
            const filtered = allNotebooks.filter(nb => nb.type.toLowerCase() === type.toLowerCase())
            setNotebooks(filtered)
            if (filtered.length > 0 && !selectedNotebookId) {
                setSelectedNotebookId(filtered[0].id)
            }
            if (filtered.length === 0 && !itemPayloads) {
                setIsCreatingNew(true)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateAndSave = async () => {
        if (isCreatingNew && !newNotebookName.trim()) {
            toast.error("Name required", { description: "Please enter a notebook name" })
            return
        }

        setIsSaving(true)
        try {
            let targetNotebookId = selectedNotebookId

            // 1. Create notebook if needed
            if (isCreatingNew) {
                const res = await createNotebook({
                    name: newNotebookName.trim(),
                    type: type,
                    color: "primary"
                })
                if (!res.success || !res.notebook) {
                    throw new Error(res.error || "Failed to create notebook")
                }
                targetNotebookId = res.notebook.id
            }

            if (!targetNotebookId) {
                throw new Error("No notebook selected")
            }

            // 2. Add item(s) to notebook — sequential batching (2 at a time)
            // Avoids overwhelming the backend connection pool on Render Free Tier
            const BATCH_SIZE = 2
            const results: Awaited<ReturnType<typeof createNotebookItem>>[] = []
            for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
                const batch = payloads.slice(i, i + BATCH_SIZE)
                const batchResults = await Promise.all(
                    batch.map(payload => createNotebookItem({ notebookId: targetNotebookId, ...payload }))
                )
                results.push(...batchResults)
                // Small delay between batches to let the server breathe
                if (i + BATCH_SIZE < payloads.length) {
                    await new Promise(r => setTimeout(r, 150))
                }
            }

            const saved_count = results.filter(r => r.success).length
            const failed_count = results.filter(r => !r.success).length

            if (saved_count === 0) {
                throw new Error("Failed to save any items. Please try again.")
            }

            setSaved(true)
            if (failed_count > 0) {
                toast.warning(`Saved ${saved_count}/${results.length} items`, {
                    description: `${failed_count} item(s) failed. Please try saving them again.`,
                })
            } else {
                toast.success("Saved successfully!", {
                    description: itemPayloads
                        ? `Added ${saved_count} items to notebook.`
                        : `Added "${itemPayload?.word}" to notebook.`,
                })
            }
            
            setTimeout(() => setOpen(false), 1500)

        } catch (error: any) {
            toast.error("Error saving item", {
                description: error.message || "An unknown error occurred",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) {
                // Reset states on close
                setTimeout(() => {
                    setIsCreatingNew(false)
                    setNewNotebookName("")
                    if (!saved) setSaved(false)
                }, 300)
            }
        }}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={saved ? "text-primary-600" : "text-slate-400 hover:text-primary-600"}
                        title={saved ? 'Added to Notebook' : 'Add to Notebook'}
                        aria-label={saved ? 'Added to Notebook' : 'Add to Notebook'}
                    >
                        {saved ? <Check className="w-5 h-5" /> : <BookPlus className="w-5 h-5" />}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save to Notebook</DialogTitle>
                    <DialogDescription>
                        {itemPayloads 
                            ? `Save ${itemPayloads.length} items to your ${type} notebook.` 
                            : `Save `}<span className="font-semibold text-slate-700">{!itemPayloads && `"${itemPayload?.word}"`}</span>{!itemPayloads && ` to your ${type} notebook.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                    ) : isCreatingNew ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-sm font-medium text-slate-700">New Notebook Name</label>
                            <Input 
                                placeholder={`e.g., Important ${type === 'vocabulary' ? 'Words' : 'Rules'}`} 
                                value={newNotebookName}
                                onChange={(e) => setNewNotebookName(e.target.value)}
                                autoFocus
                            />
                            <button onClick={() => setIsCreatingNew(false)} className="text-xs text-primary-600 hover:underline mt-2">
                                Cancel creating new (Select existing)
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2 animate-in fade-in">
                            <label className="text-sm font-medium text-slate-700">Select Notebook</label>
                            <Select value={selectedNotebookId} onValueChange={setSelectedNotebookId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={notebooks.length === 0 ? "No notebooks found" : "Choose a notebook"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {notebooks.length === 0 ? (
                                        <SelectItem value="empty" disabled>No notebooks available</SelectItem>
                                    ) : (
                                        notebooks.map(nb => (
                                            <SelectItem key={nb.id} value={nb.id}>{nb.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <button onClick={() => setIsCreatingNew(true)} className="text-xs flex items-center gap-1 text-primary-600 hover:underline mt-2">
                                <Plus className="w-3 h-3" /> Create new notebook instead
                            </button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleCreateAndSave} disabled={isSaving || saved || (!isCreatingNew && !selectedNotebookId)} className="bg-primary-600 hover:bg-primary-700 gap-2">
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saved ? "Saved!" : "Save Item"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
