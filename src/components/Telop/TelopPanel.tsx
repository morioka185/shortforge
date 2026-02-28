import { TemplateList } from "./TemplateList";
import { StyleEditor } from "./StyleEditor";
import { AnimationPreview } from "./AnimationPreview";

export function TelopPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-850 border-r border-gray-700">
      <TemplateList />
      <div className="border-t border-gray-700" />
      <StyleEditor />
      <div className="border-t border-gray-700" />
      <AnimationPreview />
    </div>
  );
}
