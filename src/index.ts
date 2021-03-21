import joplin from 'api';
import { MenuItemLocation, ToolbarButtonLocation } from 'api/types';

joplin.plugins.register({
	onStart: async function() {
		await joplin.commands.register({
			name: 'trash',
			label: 'Move to Trash',
			iconName: 'fas fa-trash-alt',
			execute: async () => {
				// Get selected note IDs, bail if none are currently selected
				const selectedNoteIds = await joplin.workspace.selectedNoteIds();
				if (selectedNoteIds.length === 0) return;

				// Get or create the trash folder
				let trashFolder = await joplin.data.get(['search'], { type: 'folder', query: 'Trash' });
				if (!trashFolder.items.length) {
					trashFolder = await joplin.data.post(['folders'], null, { title: 'Trash' });
				} else {
					trashFolder = trashFolder.items[0];
				}

				// Move the notes to the trash
				selectedNoteIds.forEach(async function (id) {
					await joplin.data.put(['notes', id], null, { parent_id: trashFolder.id });
				})
			},
		});

		await joplin.views.toolbarButtons.create('trashButton', 'trash', ToolbarButtonLocation.NoteToolbar);
		await joplin.views.menuItems.create('trashMenuItem', 'trash', MenuItemLocation.Note);
		await joplin.views.menuItems.create('trashContextMenuItem', 'trash', MenuItemLocation.NoteListContextMenu);
	},
});
