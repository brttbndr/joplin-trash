import joplin from "api";
import {
    MenuItemLocation,
    SettingItemType,
    ToolbarButtonLocation,
} from "api/types";

const TRASH_NAME = "trashName";

async function moveNotesToTrash(trash_id: String, ids: String[]) {
    ids.forEach(async (id: string) => {
        await joplin.data.put(["notes", id], null, { parent_id: trash_id });
    });
}

async function getOrCreateTrashFolder(trashName: String) {
    let trashFolder = await joplin.data.get(["search"], {
        type: "folder",
        query: trashName,
    });
    if (!trashFolder.items.length) {
        trashFolder = await joplin.data.post(["folders"], null, {
            title: trashName,
        });
    } else {
        trashFolder = trashFolder.items[0];
    }
    return trashFolder;
}

joplin.plugins.register({
    onStart: async () => {
        await joplin.settings.registerSection("trashSection", {
            label: "Trash",
            iconName: "fa fa-trash-alt",
        });

        await joplin.settings.registerSetting(TRASH_NAME, {
            value: "Trash",
            type: SettingItemType.String,
            section: "trashSection",
            public: true,
            label: 'Name of Trash notebook (default "Trash")',
        });

        joplin.settings.onChange(async (event: any) => {
            const trashName = await joplin.settings.value(TRASH_NAME);
            if (trashName.trim() === "") {
                await joplin.settings.setValue(TRASH_NAME, "Trash");
            }
        });

        await joplin.commands.register({
            name: "trash",
            label: "Move to Trash",
            iconName: "fas fa-trash-alt",
            execute: async () => {
                const trashName = await joplin.settings.value(TRASH_NAME);

                // Get selected note IDs, bail if none are currently selected
                const selectedNoteIds = await joplin.workspace.selectedNoteIds();
                if (selectedNoteIds.length === 0) return;

                const trashFolder = await getOrCreateTrashFolder(trashName);
                await moveNotesToTrash(trashFolder.id, selectedNoteIds);
            },
        });

        await joplin.views.toolbarButtons.create(
            "trashButton",
            "trash",
            ToolbarButtonLocation.NoteToolbar
        );
        await joplin.views.menuItems.create(
            "trashMenuItem",
            "trash",
            MenuItemLocation.Note
        );
        await joplin.views.menuItems.create(
            "trashContextMenuItem",
            "trash",
            MenuItemLocation.NoteListContextMenu
        );
    },
});
