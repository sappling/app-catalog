(function () {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.apps.roadmapplanningboard.PlanningGridBoard', {
        extend: 'Rally.ui.gridboard.GridBoard',
        alias: 'widget.roadmapplanninggridboard',
        requires: [
            'Rally.ui.gridboard.plugin.GridBoardAddNew',
            'Rally.ui.gridboard.plugin.GridBoardFilterControl',
            'Rally.ui.gridboard.plugin.GridBoardFeedback',
            'Rally.apps.roadmapplanningboard.plugin.RoadmapScrollable',
            'Rally.apps.roadmapplanningboard.PlanningBoard'
        ],

        cls: 'roadmap-board',

        config: {
            /**
             * @cfg {Rally.data.Model} The roadmap to use
             */
            roadmap: null,

            /**
             * @cfg {Rally.data.Model} The timeline to use
             */
            timeline: null,

            /**
             * @cfg {Object} A Rally context
             */
            context: null,

            /**
             * @cfg {Object} Object containing Names and TypePaths of the lowest level portfolio item (eg: 'Feature') and optionally its parent (eg: 'Initiative')
             */
            typeNames: {},

            cardboardPlugins: []
        },

        initComponent: function () {
            if(!this.typeNames.child || !this.typeNames.child.name) {
                throw 'typeNames must have a child property with a name';
            }

            this.addNewPluginConfig = {
                listeners: {
                    beforecreate: this._onBeforeCreate,
                    beforeeditorshow: this._onBeforeCreate
                },
                fieldLabel: 'New ' + this.typeNames.child.name
            };
            this.plugins = [
                'rallygridboardaddnew',
                {
                    ptype: 'rallygridboardfeedback',
                    feedbackDialogConfig: {
                        title: 'Feedback on Roadmap Planning Board',
                        subject: 'Roadmap Planning Board',
                        feedbackId: 'roadmapplanningboard'
                    }
                }
            ];

            this.cardBoardConfig = {
                xtype: 'roadmapplanningboard',
                context: this.context,
                roadmap: this.roadmap,
                timeline: this.timeline,
                isAdmin: this._isUserAdmin(),
                types: this.modelNames,
                typeNames: this.typeNames,
                attribute: 'Name',
                plugins: [
                    {
                        ptype: 'rallytimeframescrollablecardboard', timeframeColumnCount: 3
                    }
                ].concat(this.cardboardPlugins)
            };

            // Assume global context if it wasn't passed
            if (!this.context) {
                this.context = Rally.environment.getContext();
            }

            this.callParent(arguments);
        },

        _initialFilter: function (component, filters) {
            component.on('filter', this._onFilter, this);
            this._applyFilter(filters);
            this.config.storeConfig.autoLoad = true;
            this.loadStore();
        },

        _onFilter: function (component, filters) {
            this._applyFilter(filters);
            this.refresh(this.config);
        },

        _applyFilter: function (filters) {
            this.queryFilter = filters[0];

            if (this.queryFilter) {
                this.filterButton.removeCls('secondary');
                this.filterButton.addCls('primary');
            } else {
                this.filterButton.removeCls('primary');
                this.filterButton.addCls('secondary');
            }
        },

        /**
         * This method is fired by AddNew and will run before the artifact is created.
         * Scoping will be the GridBoardAddNew plugin (because of issues with deep merging of the listener config and the scope)
         * @private
         */
        _onBeforeCreate: function (addNew, record, params) {
            // the order of arguments is different between beforecreate and beforeeditorshow
            if (!record.isModel) {
                params = record;
            }
            var rankRecord = this.gridboard.getGridOrBoard().getFirstRecord();
            if (rankRecord) {
                params.rankAbove = rankRecord.getUri();
            }
        },

        _isUserAdmin: function () {
            var permissions = Rally.environment.getContext().getPermissions();
            var isAdmin = permissions.isSubscriptionAdmin();
            if (!isAdmin) {
                var workspace = this.getContext().getWorkspace();
                isAdmin = permissions.isWorkspaceAdmin(workspace._ref);
            }
            return isAdmin;
        }
    });

})();
