import joplin from "api";
import {
    MenuItemLocation,
    SettingItemType,
    ToolbarButtonLocation,
} from "api/types";

const TRASH_NAME = "trashName";

const sqlite3 = joplin.require('sqlite3');
let db = null;

const trashDDL = `
CREATE TABLE IF NOT EXISTS notes(
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL DEFAULT "",
  trashed_time INT NOT NULL
);

CREATE INDEX IF NOT EXISTS notes_trashed_time ON notes (trashed_time);
`;

async function initializeDB() {
    const dataDir = await joplin.plugins.dataDir();
    const dbPath = dataDir + '/trash.db';
    db = new sqlite3.Database(dbPath);
    db.serialize(() => db.run(trashDDL));
}

async function moveNotesToTrash(trash_id: String, ids: String[]) {
    const now = Date.now();
    ids.forEach(async (id: string) => {
        const note = await joplin.data.get(["notes", id]);
        // TODO: should "already in trash" no-op? Or perhaps reset the trashed_time?
        if (note.parent_id === trash_id) return;
        db.run(
            "INSERT INTO notes(id, parent_id, trashed_time) VALUES(?, ?, ?)",
            id,
            note.parent_id,
            now
        );
        await joplin.data.put(["notes", id], null, { parent_id: trash_id });
    });
}

async function restoreNotesFromTrash(trash_id, ids: String[]) {
    ids.forEach(async (id: string) => {
        const note = await joplin.data.get(["notes", id]);
        // TODO: if note is not in trash, what to do?
        if (note.parent_id != trash_id) return;
        db.serialize(() => {
            db.get("SELECT * FROM notes WHERE id = ?", [id], (err, row) => {
                joplin.data.put(["notes", id], null, { parent_id: row.parent_id });
            });
            db.run("DELETE FROM notes WHERE id = ?", id);
        });
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
        await initializeDB();

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

        await joplin.commands.register({
            name: "restoreFromTrash",
            label: "Restore from Trash",
            iconName: "fas fa-trash-alt",
            execute: async () => {
                const trashName = await joplin.settings.value(TRASH_NAME);

                // Get selected note IDs, bail if none are currently selected
                const selectedNoteIds = await joplin.workspace.selectedNoteIds();
                if (selectedNoteIds.length === 0) return;

                const trashFolder = await getOrCreateTrashFolder(trashName);
                await restoreNotesFromTrash(trashFolder.id, selectedNoteIds);
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
