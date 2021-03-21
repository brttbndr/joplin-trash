import joplin from 'api';

joplin.plugins.register({
	onStart: async function() {
		await joplin.commands.register({
			name: 'trash',
			label: 'Trash',
			iconName: 'fas fa-trash-alt',
			execute: async () => {
				// Get the selected note and exit if none is currently selected
				const selectedNote = await joplin.workspace.selectedNote();
				if (!selectedNote) return;
				
				// Get the trash folder and create it if it doesn't already exist
				let trashFolder = await joplin.data.get('search', { type: 'folder', query: 'Trash' });
				
				if (!trashFolder.items.length) {
					trashFolder = await joplin.data.post('folders', { title: 'Trash' });
				} else {
					trashFolder = trashFolder.items[0];
				}

				// Move the note to the trash
				await joplin.data.put(['notes', selectedNote.id], { parent_id: trashFolder.id });
			},
		});
	},
});
