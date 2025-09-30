export type RichTextResource =
	| {
			id: string;
			title: string;
			_type: string;
	  }
	| {
			id: null;
			title: null;
			_type: null;
	  };
