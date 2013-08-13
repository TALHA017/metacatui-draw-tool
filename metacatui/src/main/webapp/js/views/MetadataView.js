/*global define */
define(['jquery',
		'underscore', 
		'backbone',
		'text!templates/sideBar.html'
		], 				
	function($, _, Backbone, SideBarTemplate) {
	'use strict';
	
	var MetadataView = Backbone.View.extend({

		el: '#Content',
		
		template: null,
		
		sideTemplate: _.template(SideBarTemplate),
		
		// Delegated events for creating new items, and clearing completed ones.
		events: {
			"click #publish": "publish"
		},
		
		initialize: function () {
			
		},
				
		// Render the main metadata view
		render: function () {

			console.log('Rendering the Metadata view');
			appModel.set('headerType', 'default');
			appModel.set('navbarPosition', 'fixed');
			
			// get the pid to render
			var pid = appModel.get('pid');
			
			// load the document view from the server
			var endpoint = appModel.get('viewServiceUrl') + pid + ' #Metadata';
			console.log('calling view endpoint: ' + endpoint);

			var viewRef = this;
			this.$el.load(endpoint,
					function(response, status, xhr) {
				
						if (status == "error") {
							viewRef.showMessage(response);
						} else {
							viewRef.insertResourceMapLink(pid);
							viewRef.insertSideBar(pid);
						}
						console.log('Loaded metadata, now fading in MetadataView');
						viewRef.$el.fadeIn('slow');
						
					});
			
			return this;
		},
		
		// this will insert the ORE package download link if available
		insertResourceMapLink: function(pid) {
			var resourceMapId = null;
			// look up the resourceMapId[s]
			var queryServiceUrl = appModel.get('queryServiceUrl');
			var packageServiceUrl = appModel.get('packageServiceUrl');

			// surround pid value in "" so that doi characters do not affect solr query
			var query = 'fl=id,resourceMap&wt=xml&q=formatType:METADATA+-obsoletedBy:*+resourceMap:*+id:"' + pid + '"';
			$.get(
					queryServiceUrl + query,
					function(data, textStatus, xhr) {
						
						// the response should have a resourceMap element
						resourceMapId = $(data).find("arr[name='resourceMap'] str").text();
						console.log('resourceMapId: ' + resourceMapId);
						
						if (resourceMapId) {
														
							$("#downloadPackage").html(
								'<a class="btn" href="' 
									+ packageServiceUrl + resourceMapId + '">' 
									+ 'Download Package <i class="icon-arrow-down"></i>'
								+ '</a>'
							);
						}
						
					}
				);
				
		},
		
		// this will insert the DOI publish button
		insertSideBar: function(pid) {
			// look up the SystemMetadata
			var metaServiceUrl = appModel.get('metaServiceUrl');

			// systemMetadata to render
			var identifier = null;
			var formatId = null;
			var size = null;
			var checksum = null;
			var rightsHolder = null;
			var submitter = null;
			
			var viewRef = this;
			
			// get the /meta for the pid
			$.get(
					metaServiceUrl + pid,
					function(data, textStatus, xhr) {
						
						// the response should have all the elements we want
						identifier = $(data).find("identifier").text();
						console.log('identifier: ' + identifier);
						formatId = $(data).find("formatId").text();
						size = $(data).find("size").text();
						checksum = $(data).find("checksum").text();
						rightsHolder = $(data).find("rightsHolder").text();
						submitter = $(data).find("submitter").text();

						if (identifier) {
							// TODO: include SystemMetadata details
							viewRef.$el.find("#Metadata").prepend(
									viewRef.sideTemplate({
										identifier: identifier,
										formatId: formatId,
										size: size,
										checksum: checksum,
										rightsHolder: rightsHolder,
										submitter: submitter
									})
								);
						}
						
					}
				);
				
		},
		
		publish: function(event) {
			
			var publishServiceUrl = appModel.get('publishServiceUrl');

			var pid = $(event.target).attr("pid");
			var ret = confirm("Are you sure you want to publish " + pid + " with a DOI?");
			
			if (ret) {
				var identifier = null;
				var viewRef = this;
				$.ajax({
						url: publishServiceUrl + pid,
						type: "PUT",
						success: function(data, textStatus, xhr) {
							// the response should have new identifier in it
							identifier = $(data).find("identifier").text();
							console.log('identifier: ' + identifier);
							if (identifier) {
								alert("Published package: " + identifier);	
								// navigate to the new view
								uiRouter.navigate("view/" + identifier, {trigger: true})
							}
						},
						error: function(xhr, textStatus, errorThrown) {
							var msg = $(xhr.responseText).find("description").text();
							viewRef.showMessage(msg, true);
						}
					}
				);
				
			}
		},
		
		showMessage: function(msg, prepend) {
			if (prepend) {
				this.$el.prepend('<section id="Notification"><div class="alert"><h4>Oops!</h4>' + msg + '</div></section>');
			} else {
				this.$el.html('<section id="Notification"><div class="alert"><h4>Oops!</h4>' + msg + '</div></section>');
			}

		},
		
		onClose: function () {			
			console.log('Closing the metadata view');
		}				
	});
	return MetadataView;		
});
