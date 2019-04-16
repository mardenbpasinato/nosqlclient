/* eslint-env mocha */

import sinon from 'sinon';
import { expect } from 'chai';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Connection } from '/client/imports/ui';
import { ErrorHandler, SessionManager, Notification, UIComponents } from '/client/imports/modules';
import { Communicator, ReactivityProvider } from '/client/imports/facades';
import $ from 'jquery';
import Helper from '/client/imports/helpers/helper';
import ConnectionHelper from '/client/imports/ui/connection/helper';

require('/client/plugins/colorpicker/js/bootstrap-colorpicker.min');

describe('Connection', () => {
  describe('prepareModal tests', () => {
    const translated = 'TESTTRANSLATED';
    const connectionId = '123123123';

    const assert = function (editOrClone) {
      expect($.prototype.text.callCount).to.equal(1);
      expect($.prototype.text.calledWithExactly(translated)).to.equal(true);
      expect($.prototype.data.callCount).to.equal(2);
      expect($.prototype.data.calledWithExactly('edit', editOrClone === 'edit' ? connectionId : '')).to.equal(true);
      expect($.prototype.data.calledWithExactly('clone', editOrClone === 'clone' ? connectionId : '')).to.equal(true);
      expect($.prototype.modal.callCount).to.equal(1);
      expect($.prototype.modal.calledWithExactly('show')).to.equal(true);
      expect(SessionManager.get.callCount).to.equal(editOrClone ? 1 : 0);
      if (editOrClone) expect(SessionManager.get.calledWithExactly(SessionManager.strSessionConnection)).to.equal(true);
    };

    beforeEach(() => {
      sinon.stub($.prototype, 'data');
      sinon.stub($.prototype, 'modal');
      sinon.stub($.prototype, 'text');
      sinon.stub(Helper, 'translate').returns(translated);
      sinon.stub(SessionManager, 'get').withArgs(SessionManager.strSessionConnection).returns({ _id: connectionId });
    });

    afterEach(() => {
      $.prototype.data.restore();
      $.prototype.modal.restore();
      $.prototype.text.restore();
      Helper.translate.restore();
      SessionManager.get.restore();
    });

    it('prepareModal no param', () => {
      // prepare
      // execute
      Connection.prepareModal();

      // verify
      assert();
    });

    it('prepareModal valid param edit', () => {
      // prepare
      // execute
      Connection.prepareModal('does not matter', 'edit');

      // verify
      assert('edit');
    });

    it('prepareModal valid param clone', () => {
      // prepare
      // execute
      Connection.prepareModal('does not matter', 'clone');

      // verify
      assert('clone');
    });
  });

  describe('disconnect tests', () => {
    beforeEach(() => {
      sinon.stub(Communicator, 'call');
      sinon.stub(SessionManager, 'clear');
      sinon.stub(FlowRouter, 'go');
    });

    afterEach(() => {
      Communicator.call.restore();
      SessionManager.clear.restore();
      FlowRouter.go.restore();
    });

    it('disconnect', () => {
      // prepare
      // execute
      Connection.disconnect();

      // verify
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({ methodName: 'disconnect' })).to.equal(true);
      expect(SessionManager.clear.callCount).to.equal(1);
      expect(SessionManager.clear.calledWithExactly()).to.equal(true);
      expect(FlowRouter.go.callCount).to.equal(1);
      expect(FlowRouter.go.calledWithExactly('/databaseStats')).to.equal(true);
    });
  });

  describe('prepareContextMenu tests', () => {
    const connectionId = '12321312';
    const connection = { x: 1, y: true, z: 'sercan' };

    beforeEach(() => {
      sinon.stub($, 'contextMenu');
      sinon.stub($.prototype, 'data');
      sinon.stub($.prototype, 'modal');
      sinon.stub($.prototype, 'DataTable').returns({ row: sinon.stub().returns({ data: sinon.stub().returns({ _id: connectionId }) }) });
      sinon.stub(ReactivityProvider, 'findOne').returns(connection);
      sinon.stub(ErrorHandler, 'showMeteorFuncError');
      sinon.stub(Notification, 'success');
      sinon.stub(Connection, 'populateConnectionsTable');
    });

    afterEach(() => {
      $.contextMenu.restore();
      $.prototype.data.restore();
      $.prototype.modal.restore();
      $.prototype.DataTable.restore();
      ReactivityProvider.findOne.restore();
      ErrorHandler.showMeteorFuncError.restore();
      Notification.success.restore();
      Connection.populateConnectionsTable.restore();
    });

    it('prepareContextMenu colorize callback', () => {
      // prepare
      // execute
      Connection.prepareContextMenu();
      $.contextMenu.getCall(0).args[0].items.colorize.callback(null, { $trigger: ['something'] });

      // verify
      expect($.contextMenu.callCount).to.equal(1);
      expect($.contextMenu.getCall(0).args[0].items).to.have.property('colorize');
      expect($.contextMenu.getCall(0).args[0].items).to.have.property('clear_color');
      expect($.prototype.data.callCount).to.equal(1);
      expect($.prototype.data.calledWithExactly('connection', connectionId)).to.equal(true);
      expect($.prototype.modal.callCount).to.equal(1);
      expect($.prototype.modal.calledWithExactly('show')).to.equal(true);
    });

    it('prepareContextMenu clear_color callback && communicator yields to error', () => {
      // prepare
      const error = { error: '123' };
      sinon.stub(Communicator, 'call').yieldsTo('callback', error, null);

      // execute
      Connection.prepareContextMenu();
      $.contextMenu.getCall(0).args[0].items.clear_color.callback(null, { $trigger: ['something'] });

      // verify
      expect($.contextMenu.callCount).to.equal(1);
      expect($.contextMenu.getCall(0).args[0].items).to.have.property('colorize');
      expect($.contextMenu.getCall(0).args[0].items).to.have.property('clear_color');
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'saveConnection',
        args: { connection: Object.assign({ color: '' }, connection) },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(1);
      expect(ErrorHandler.showMeteorFuncError.calledWithExactly(error, null)).to.equal(true);

      // cleanup
      Communicator.call.restore();
    });

    it('prepareContextMenu clear_color callback && communicator yields to success', () => {
      // prepare
      sinon.stub(Communicator, 'call').yieldsTo('callback');

      // execute
      Connection.prepareContextMenu();
      $.contextMenu.getCall(0).args[0].items.clear_color.callback(null, { $trigger: ['something'] });

      // verify
      expect($.contextMenu.callCount).to.equal(1);
      expect($.contextMenu.getCall(0).args[0].items).to.have.property('colorize');
      expect($.contextMenu.getCall(0).args[0].items).to.have.property('clear_color');
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'saveConnection',
        args: { connection: Object.assign({ color: '' }, connection) },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(0);
      expect(Notification.success.callCount).to.equal(1);
      expect(Notification.success.calledWithExactly('saved-successfully')).to.equal(true);
      expect(Connection.populateConnectionsTable.callCount).to.equal(1);
      expect(Connection.populateConnectionsTable.calledWithExactly()).to.equal(true);

      // cleanup
      Communicator.call.restore();
    });
  });

  describe('prepareColorizeModal tests', () => {
    const color = '#111111';

    beforeEach(() => {
      const connectionId = '1231235612';

      sinon.stub($.prototype, 'colorpicker');
      sinon.stub($.prototype, 'on').yields(null);
      sinon.stub($.prototype, 'data').withArgs('connection').returns(connectionId);
      sinon.stub(ReactivityProvider, 'findOne').withArgs(ReactivityProvider.types.Connections, { _id: connectionId }).returns({ color });
    });

    afterEach(() => {
      $.prototype.colorpicker.restore();
      $.prototype.on.restore();
      $.prototype.data.restore();
      ReactivityProvider.findOne.restore();
    });

    it('prepareColorizeModal', () => {
      // prepare
      // execute
      Connection.prepareColorizeModal();

      // verify
      expect($.prototype.colorpicker.callCount).to.equal(2);
      expect($.prototype.colorpicker.calledWithMatch({ align: 'left', format: 'hex' })).to.equal(true);
      expect($.prototype.colorpicker.calledWithMatch('setValue', color)).to.equal(true);
      expect($.prototype.on.callCount).to.equal(1);
      expect($.prototype.on.calledWithMatch('shown.bs.modal', sinon.match.func)).to.equal(true);
    });
  });

  describe('colorize tests', () => {
    const connectionId = '1231235612';
    const color = '#111111';
    const connection = { x: 1, y: true, color: 'test' };

    beforeEach(() => {
      sinon.stub(ReactivityProvider, 'findOne').withArgs(ReactivityProvider.types.Connections, { _id: connectionId }).returns(connection);
      sinon.stub(Notification, 'error');
      sinon.stub(Notification, 'success');
      sinon.stub(ErrorHandler, 'showMeteorFuncError');
      sinon.stub(Connection, 'populateConnectionsTable');
    });

    afterEach(() => {
      $.prototype.val.restore();
      $.prototype.data.restore();
      ReactivityProvider.findOne.restore();
      Communicator.call.restore();
      Notification.error.restore();
      ErrorHandler.showMeteorFuncError.restore();
      Notification.success.restore();
      Connection.populateConnectionsTable.restore();
    });

    it('colorize no color', () => {
      // prepare
      sinon.stub($.prototype, 'val');
      sinon.stub($.prototype, 'data');
      sinon.stub(Communicator, 'call');

      // execute
      Connection.colorize();

      // verify
      expect($.prototype.data.callCount).to.equal(0);
      expect(Communicator.call.callCount).to.equal(0);
      expect(ReactivityProvider.findOne.callCount).to.equal(0);
      expect(Notification.error.callCount).to.equal(1);
      expect(Notification.error.calledWithExactly('color-required')).to.equal(true);
      expect(Connection.populateConnectionsTable.callCount).to.equal(0);
    });

    it('colorize no connectionId', () => {
      // prepare
      sinon.stub($.prototype, 'val').returns(color);
      sinon.stub($.prototype, 'data');
      sinon.stub(Communicator, 'call');

      // execute
      Connection.colorize();

      // verify
      expect($.prototype.val.callCount).to.equal(1);
      expect($.prototype.val.calledWithExactly()).to.equal(true);
      expect($.prototype.val.getCall(0).thisValue.selector).to.equal('#inputColor');
      expect($.prototype.data.callCount).to.equal(1);
      expect($.prototype.data.calledWithExactly('connection')).to.equal(true);
      expect($.prototype.data.getCall(0).thisValue.selector).to.equal('#colorizeModal');
      expect(Communicator.call.callCount).to.equal(0);
      expect(ReactivityProvider.findOne.callCount).to.equal(0);
      expect(Notification.error.callCount).to.equal(1);
      expect(Notification.error.calledWithExactly('select-connection')).to.equal(true);
      expect(Connection.populateConnectionsTable.callCount).to.equal(0);
    });

    it('colorize communicator yields to erorr', () => {
      // prepare
      const error = { error: '1233' };

      sinon.stub($.prototype, 'val').returns(color);
      sinon.stub($.prototype, 'data').returns(connectionId);
      sinon.stub(Communicator, 'call').yieldsTo('callback', error, null);

      // execute
      Connection.colorize();

      // verify
      const newConnection = { ...connection };
      newConnection.color = color;
      expect($.prototype.val.callCount).to.equal(1);
      expect($.prototype.val.calledWithExactly()).to.equal(true);
      expect($.prototype.val.getCall(0).thisValue.selector).to.equal('#inputColor');
      expect($.prototype.data.callCount).to.equal(1);
      expect($.prototype.data.calledWithExactly('connection')).to.equal(true);
      expect($.prototype.data.getCall(0).thisValue.selector).to.equal('#colorizeModal');
      expect(Notification.error.callCount).to.equal(0);
      expect(ReactivityProvider.findOne.callCount).to.equal(1);
      expect(ReactivityProvider.findOne.calledWithExactly(ReactivityProvider.types.Connections, { _id: connectionId })).to.equal(true);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'saveConnection',
        args: { connection: newConnection },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(1);
      expect(ErrorHandler.showMeteorFuncError.calledWithExactly(error, null)).to.equal(true);
      expect(Connection.populateConnectionsTable.callCount).to.equal(0);
    });

    it('colorize communicator yields to success', () => {
      // prepare
      sinon.stub($.prototype, 'val').returns(color);
      sinon.stub($.prototype, 'data').returns(connectionId);
      sinon.stub(Communicator, 'call').yieldsTo('callback', null, {});

      // execute
      Connection.colorize();

      // verify
      const newConnection = { ...connection };
      newConnection.color = color;
      expect($.prototype.val.callCount).to.equal(1);
      expect($.prototype.val.calledWithExactly()).to.equal(true);
      expect($.prototype.val.getCall(0).thisValue.selector).to.equal('#inputColor');
      expect($.prototype.data.callCount).to.equal(1);
      expect($.prototype.data.calledWithExactly('connection')).to.equal(true);
      expect($.prototype.data.getCall(0).thisValue.selector).to.equal('#colorizeModal');
      expect(Notification.error.callCount).to.equal(0);
      expect(ReactivityProvider.findOne.callCount).to.equal(1);
      expect(ReactivityProvider.findOne.calledWithExactly(ReactivityProvider.types.Connections, { _id: connectionId })).to.equal(true);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'saveConnection',
        args: { connection: newConnection },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(0);
      expect(Connection.populateConnectionsTable.callCount).to.equal(1);
      expect(Connection.populateConnectionsTable.calledWithExactly()).to.equal(true);
      expect(Notification.success.callCount).to.equal(1);
      expect(Notification.success.calledWithExactly('saved-successfully')).to.equal(true);
    });
  });

  describe('switchDatabase tests', () => {
    const connection = { x: 1, y: 2, databaseName: 'sercan' };
    const connectionId = '123123';

    beforeEach(() => {
      sinon.stub(SessionManager, 'get').returns({ _id: connectionId });
      sinon.stub(ReactivityProvider, 'findOne').withArgs(ReactivityProvider.types.Connections, { _id: connectionId }).returns(connection);
      sinon.stub(Notification, 'error');
      sinon.stub(Notification, 'start');
      sinon.stub(ErrorHandler, 'showMeteorFuncError');
      sinon.stub(Connection, 'connect');
    });

    afterEach(() => {
      $.prototype.val.restore();
      SessionManager.get.restore();
      ReactivityProvider.findOne.restore();
      Communicator.call.restore();
      Notification.error.restore();
      Notification.start.restore();
      ErrorHandler.showMeteorFuncError.restore();
      Connection.connect.restore();
    });

    it('switchDatabase no database', () => {
      // prepare
      sinon.stub($.prototype, 'val');
      sinon.stub(Communicator, 'call');

      // execute
      Connection.switchDatabase();

      // verify
      expect(Communicator.call.callCount).to.equal(0);
      expect(ReactivityProvider.findOne.callCount).to.equal(0);
      expect(Notification.error.callCount).to.equal(1);
      expect(Notification.error.calledWithExactly('enter_or_choose_database')).to.equal(true);
      expect(Notification.start.callCount).to.equal(0);
      expect(Connection.connect.callCount).to.equal(0);
    });

    it('switchDatabase communicator yields to error', () => {
      // prepare
      const error = { error: '1233' };
      const databaseName = 'tugce';

      sinon.stub($.prototype, 'val').returns(databaseName);
      sinon.stub(Communicator, 'call').yieldsTo('callback', error, null);

      // execute
      Connection.switchDatabase();

      // verify
      const newConnection = { ...connection };
      newConnection.databaseName = databaseName;

      expect(Notification.start.callCount).to.equal(1);
      expect(Notification.start.calledWithExactly('#btnConnectSwitchedDatabase')).to.equal(true);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'saveConnection',
        args: { connection: newConnection },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ReactivityProvider.findOne.callCount).to.equal(1);
      expect(ReactivityProvider.findOne.calledWithExactly(ReactivityProvider.types.Connections, { _id: connectionId })).to.equal(true);
      expect(Notification.error.callCount).to.equal(0);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(1);
      expect(ErrorHandler.showMeteorFuncError.calledWithExactly(error, null)).to.equal(true);
      expect(Connection.connect.callCount).to.equal(0);
    });

    it('switchDatabase communicator yields to success', () => {
      // prepare
      const databaseName = 'tugce';

      sinon.stub($.prototype, 'val').returns(databaseName);
      sinon.stub(Communicator, 'call').yieldsTo('callback');

      // execute
      Connection.switchDatabase();

      // verify
      const newConnection = { ...connection };
      newConnection.databaseName = databaseName;

      expect(Notification.start.callCount).to.equal(1);
      expect(Notification.start.calledWithExactly('#btnConnectSwitchedDatabase')).to.equal(true);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'saveConnection',
        args: { connection: newConnection },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ReactivityProvider.findOne.callCount).to.equal(1);
      expect(ReactivityProvider.findOne.calledWithExactly(ReactivityProvider.types.Connections, { _id: connectionId })).to.equal(true);
      expect(Notification.error.callCount).to.equal(0);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(0);
      expect(Connection.connect.callCount).to.equal(1);
      expect(Connection.connect.calledWithExactly(false)).to.equal(true);
    });
  });

  describe('showSwitchDatabaseModal tests', () => {
    let findStub;

    beforeEach(() => {
      findStub = {
        on: sinon.stub().yields(null)
      };

      sinon.stub($.prototype, 'modal');
      sinon.stub($.prototype, 'find').returns(findStub);
      sinon.stub(Notification, 'stop');
      sinon.stub(Notification, 'start');
      sinon.stub(ErrorHandler, 'showMeteorFuncError');
      sinon.stub(Connection, 'switchDatabase');
      sinon.stub(UIComponents.DataTable, 'setupDatatable');
    });

    afterEach(() => {
      $.prototype.modal.restore();
      $.prototype.find.restore();
      Communicator.call.restore();
      Notification.stop.restore();
      Notification.start.restore();
      ErrorHandler.showMeteorFuncError.restore();
      Connection.switchDatabase.restore();
      UIComponents.DataTable.setupDatatable.restore();
    });

    it('showSwitchDatabaseModal communicator yields to error', () => {
      // prepare
      const error = { error: '1233' };

      sinon.stub(Communicator, 'call').yieldsTo('callback', error, null);

      // execute
      Connection.showSwitchDatabaseModal();

      // verify
      expect($.prototype.modal.callCount).to.equal(1);
      expect($.prototype.modal.calledWithExactly('show')).to.equal(true);
      expect($.prototype.modal.getCall(0).thisValue.selector).to.equal('#switchDatabaseModal');
      expect(Notification.start.callCount).to.equal(1);
      expect(Notification.start.calledWithExactly('#btnConnectSwitchedDatabase')).to.equal(true);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'listDatabases',
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(1);
      expect(ErrorHandler.showMeteorFuncError.calledWithExactly(error, null)).to.equal(true);
      expect(Connection.switchDatabase.callCount).to.equal(0);
      expect(UIComponents.DataTable.setupDatatable.callCount).to.equal(0);
      expect($.prototype.find.callCount).to.equal(0);
      expect(findStub.on.callCount).to.equal(0);
    });

    it('switchDatabase communicator yields to success', () => {
      // prepare
      const result = { result: { databases: [{ name: 'a' }, { name: 'c' }, { name: 'b' }] } };

      sinon.stub(Communicator, 'call').yieldsTo('callback', null, result);

      // execute
      Connection.showSwitchDatabaseModal();

      // verify
      expect($.prototype.modal.callCount).to.equal(1);
      expect($.prototype.modal.calledWithExactly('show')).to.equal(true);
      expect($.prototype.modal.getCall(0).thisValue.selector).to.equal('#switchDatabaseModal');
      expect(Notification.start.callCount).to.equal(1);
      expect(Notification.start.calledWithExactly('#btnConnectSwitchedDatabase')).to.equal(true);
      expect(Notification.stop.callCount).to.equal(1);
      expect(Notification.stop.calledWithExactly()).to.equal(true);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'listDatabases',
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(0);
      expect(Connection.switchDatabase.callCount).to.equal(1);
      expect(Connection.switchDatabase.calledWithExactly()).to.equal(true);
      expect(UIComponents.DataTable.setupDatatable.callCount).to.equal(1);
      expect(UIComponents.DataTable.setupDatatable.calledWithMatch({
        selectorString: '#tblSwitchDatabases',
        columns: [{ data: 'name' }],
        data: result.result.databases.sort((a, b) => {
          if (a.name < b.name) { return -1; } if (a.name > b.name) { return 1; }
          return 0;
        })
      })).to.equal(true);
      expect($.prototype.find.callCount).to.equal(1);
      expect($.prototype.find.calledWithExactly('tbody')).to.equal(true);
      expect($.prototype.find.getCall(0).thisValue.selector).to.equal('#tblSwitchDatabases');
      expect(findStub.on.callCount).to.equal(1);
      expect(findStub.on.calledWithExactly('dblclick', 'tr', sinon.match.func)).to.equal(true);
    });
  });

  describe('setupFormForUri tests', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();

      sinon.stub(ErrorHandler, 'showMeteorFuncError');
      sinon.stub(ConnectionHelper, 'prepareFormForUrlParse');
      sinon.stub(ConnectionHelper, 'disableFormsForUri');
      sinon.stub(ConnectionHelper, 'enableFormsForUri');
    });

    afterEach(() => {
      clock.restore();

      $.prototype.val.restore();
      Communicator.call.restore();
      ErrorHandler.showMeteorFuncError.restore();
      ConnectionHelper.prepareFormForUrlParse.restore();
      ConnectionHelper.disableFormsForUri.restore();
      ConnectionHelper.enableFormsForUri.restore();
    });

    it('setupFormForUri no url', () => {
      // prepare
      sinon.stub(Communicator, 'call');
      sinon.stub($.prototype, 'val');

      // execute
      Connection.setupFormForUri();

      // verify
      expect(ConnectionHelper.enableFormsForUri.callCount).to.equal(1);
      expect(ConnectionHelper.enableFormsForUri.calledWithExactly()).to.equal(true);
      expect(Communicator.call.callCount).to.equal(0);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(0);
      expect(ConnectionHelper.prepareFormForUrlParse.callCount).to.equal(0);
      expect(ConnectionHelper.disableFormsForUri.callCount).to.equal(0);
    });

    it('setupFormForUri & communicator yields to error', () => {
      // prepare
      const error = { error: '1232131' };
      const url = 'sercanURL';
      sinon.stub(Communicator, 'call').yieldsTo('callback', error, null);
      sinon.stub($.prototype, 'val').returns(url);

      // execute
      Connection.setupFormForUri();

      // verify
      expect(ConnectionHelper.enableFormsForUri.callCount).to.equal(0);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'parseUrl',
        args: { connection: { url } },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(1);
      expect(ErrorHandler.showMeteorFuncError.calledWithExactly(error, null)).to.equal(true);
      expect(ConnectionHelper.prepareFormForUrlParse.callCount).to.equal(0);
      expect(ConnectionHelper.disableFormsForUri.callCount).to.equal(0);
    });

    it('setupFormForUri & communicator yields to success & no clock tick', () => {
      // prepare
      const result = { x: 1, y: 'z' };
      const url = 'sercanURL';
      sinon.stub(Communicator, 'call').yieldsTo('callback', null, result);
      sinon.stub($.prototype, 'val').returns(url);

      // execute
      Connection.setupFormForUri();

      // verify
      expect(ConnectionHelper.enableFormsForUri.callCount).to.equal(0);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'parseUrl',
        args: { connection: { url } },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(0);
      expect(ConnectionHelper.prepareFormForUrlParse.callCount).to.equal(1);
      expect(ConnectionHelper.prepareFormForUrlParse.calledWithExactly(result, Connection.addServerField)).to.equal(true);
      expect(ConnectionHelper.disableFormsForUri.callCount).to.equal(0);
    });

    it('setupFormForUri & communicator yields to success & clock tick', () => {
      // prepare
      const result = { x: 1, y: 'z' };
      const url = 'sercanURL';
      sinon.stub(Communicator, 'call').yieldsTo('callback', null, result);
      sinon.stub($.prototype, 'val').returns(url);

      // execute
      Connection.setupFormForUri();
      clock.tick(150);

      // verify
      expect(ConnectionHelper.enableFormsForUri.callCount).to.equal(0);
      expect(Communicator.call.callCount).to.equal(1);
      expect(Communicator.call.calledWithMatch({
        methodName: 'parseUrl',
        args: { connection: { url } },
        callback: sinon.match.func
      })).to.equal(true);
      expect(ErrorHandler.showMeteorFuncError.callCount).to.equal(0);
      expect(ConnectionHelper.prepareFormForUrlParse.callCount).to.equal(1);
      expect(ConnectionHelper.prepareFormForUrlParse.calledWithExactly(result, Connection.addServerField)).to.equal(true);
      expect(ConnectionHelper.disableFormsForUri.callCount).to.equal(1);
      expect(ConnectionHelper.disableFormsForUri.calledWithExactly()).to.equal(true);
    });
  });

  describe('populateConnectionsTable tests', () => {
    const connectionsData = { testing: 123 };

    beforeEach(() => {
      sinon.stub(ReactivityProvider, 'find').withArgs(ReactivityProvider.types.Connections).returns(connectionsData);
      sinon.stub(UIComponents.DataTable, 'setupDatatable');
    });

    afterEach(() => {
      ReactivityProvider.find.restore();
      UIComponents.DataTable.setupDatatable.restore();
    });

    it('populateConnectionsTable', () => {
      // prepare

      // execute
      Connection.populateConnectionsTable();

      // verify
      expect(UIComponents.DataTable.setupDatatable.callCount).to.equal(1);
      expect(UIComponents.DataTable.setupDatatable.calledWithMatch({
        selectorString: '#tblConnection',
        extraOptions: {
          createdRow: sinon.match.func
        },
        data: connectionsData,
        columns: [
          { data: '_id', sClass: 'hide_column' },
          { data: 'connectionName' },
          { data: 'servers' },
        ],
        columnDefs: sinon.match.array
      }
      )).to.equal(true);
    });
  });

  describe('connect tests', () => {
    const connection = { x: 1, y: 2, databaseName: 'sercan', authenticationType: 'scram_sha_1', scram_sha_1: { username: 'sercanUSER' } };
    const connectionId = '123123';

    beforeEach(() => {
      sinon.stub($.prototype, 'modal');
      sinon.stub($.prototype, 'data');
      sinon.stub(ReactivityProvider, 'findOne').withArgs(ReactivityProvider.types.Connections, { _id: connectionId }).returns(connection);
      sinon.stub(Connection, 'proceedConnecting');
      sinon.stub(Notification, 'warning');
    });

    afterEach(() => {
      $.prototype.modal.restore();
      $.prototype.data.restore();
      SessionManager.get.restore();
      ReactivityProvider.findOne.restore();
      Connection.proceedConnecting.restore();
      Notification.warning.restore();
      ConnectionHelper.isCredentialPromptNeeded.restore();
    });

    it('connect no connection', () => {
      // prepare
      sinon.stub(SessionManager, 'get');
      sinon.stub(ConnectionHelper, 'isCredentialPromptNeeded');

      // execute
      Connection.connect();

      // verify
      expect($.prototype.modal.callCount).to.equal(0);
      expect($.prototype.data.callCount).to.equal(0);
      expect(ReactivityProvider.findOne.callCount).to.equal(0);
      expect(Connection.proceedConnecting.callCount).to.equal(0);
      expect(ConnectionHelper.isCredentialPromptNeeded.callCount).to.equal(0);
      expect(Notification.warning.callCount).to.equal(1);
      expect(Notification.warning.calledWithExactly('select-connection')).to.equal(true);
    });

    it('connect isCredentialPromptNeeded false', () => {
      // prepare
      sinon.stub(SessionManager, 'get').returns({ _id: connectionId });
      sinon.stub(ConnectionHelper, 'isCredentialPromptNeeded').returns(false);

      const isRefresh = false;
      const message = 'SERCAN';
      const messageTranslateOptions = { name: 'x' };

      // execute
      Connection.connect(isRefresh, message, messageTranslateOptions);

      // verify
      expect($.prototype.modal.callCount).to.equal(0);
      expect($.prototype.data.callCount).to.equal(0);
      expect(ReactivityProvider.findOne.callCount).to.equal(1);
      expect(ReactivityProvider.findOne.calledWithExactly(ReactivityProvider.types.Connections, { _id: connectionId })).to.equal(true);
      expect(Connection.proceedConnecting.callCount).to.equal(1);
      expect(Connection.proceedConnecting.calledWithExactly({ isRefresh, message, messageTranslateOptions, connection })).to.equal(true);
      expect(ConnectionHelper.isCredentialPromptNeeded.callCount).to.equal(1);
      expect(ConnectionHelper.isCredentialPromptNeeded.calledWithExactly(connection)).to.equal(true);
      expect(Notification.warning.callCount).to.equal(0);
    });

    it('connect isCredentialPromptNeeded true', () => {
      // prepare
      sinon.stub(SessionManager, 'get').returns({ _id: connectionId });
      sinon.stub(ConnectionHelper, 'isCredentialPromptNeeded').returns(true);

      // execute
      Connection.connect();

      // verify
      expect($.prototype.modal.callCount).to.equal(1);
      expect($.prototype.modal.calledWithExactly('show')).to.equal(true);
      expect($.prototype.modal.getCall(0).thisValue.selector).to.equal('#promptUsernamePasswordModal');
      expect($.prototype.data.callCount).to.equal(3);
      expect($.prototype.data.calledWithExactly('username', 'sercanUSER')).to.equal(true);
      expect($.prototype.data.calledWithExactly('password', undefined)).to.equal(true);
      expect($.prototype.data.calledWithExactly('connection', connection)).to.equal(true);
      expect(ReactivityProvider.findOne.callCount).to.equal(1);
      expect(ReactivityProvider.findOne.calledWithExactly(ReactivityProvider.types.Connections, { _id: connectionId })).to.equal(true);
      expect(Connection.proceedConnecting.callCount).to.equal(0);
      expect(ConnectionHelper.isCredentialPromptNeeded.callCount).to.equal(1);
      expect(ConnectionHelper.isCredentialPromptNeeded.calledWithExactly(connection)).to.equal(true);
      expect(Notification.warning.callCount).to.equal(0);
    });
  });
});
