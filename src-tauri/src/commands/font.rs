use std::collections::BTreeSet;
use tauri::command;

#[command]
pub fn list_system_fonts() -> Result<Vec<String>, String> {
    let font_mgr = skia_safe::FontMgr::default();
    let count = font_mgr.count_families();
    let mut families = BTreeSet::new();

    for i in 0..count {
        let name = font_mgr.family_name(i);
        if !name.is_empty() && !name.starts_with('.') {
            families.insert(name);
        }
    }

    Ok(families.into_iter().collect())
}
