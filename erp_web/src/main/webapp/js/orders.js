$(function () {
    var url = 'orders_listByPage?t1.type=1';
    if (Request['oper'] == 'doCheck') {
        url += '&t1.state=0'
    }
    if (Request['oper'] == 'doStart') {
        url += '&t1.state=1'
    }
    if (Request['oper'] == 'doInStore') {
        url += '&t1.state=2'
    }
    //初始化订单列表
    $('#grid').datagrid({
        url: url,
        columns: [[
            {field: 'uuid', title: '编号', width: 100},
            {field: 'createtime', title: '生成日期', width: 100, formatter: formatDate},
            {field: 'checktime', title: '审核日期', width: 100, formatter: formatDate},
            {field: 'starttime', title: '确认日期', width: 100, formatter: formatDate},
            {field: 'endtime', title: '入库或出库日期', width: 100, formatter: formatDate},
            {field: 'createrName', title: '下单员', width: 100},
            {field: 'checkerName', title: '审核员', width: 100},
            {field: 'starterName', title: '采购员', width: 100},
            {field: 'enderName', title: '库管员', width: 100},
            {field: 'supplierName', title: '供应商或客户', width: 100},
            {field: 'totalmoney', title: '合计金额', width: 100},
            {field: 'state', title: '状态', width: 100, formatter: getState},
            {field: 'waybillsn', title: '运单号', width: 100}
        ]],
        singleSelect: true,
        fitColumns: true,
        pagination: true,     //显示分页工具栏
        onDblClickRow: function (rowIndex, rowData) {
            //显示详情
            $('#uuid').html(rowData.uuid);
            $('#suppliername').html(rowData.supplierName);
            $('#state').html(getState(rowData.state));
            $('#creater').html(rowData.createrName);
            $('#checker').html(rowData.checkerName);
            $('#starter').html(rowData.starterName);
            $('#ender').html(rowData.enderName);
            $('#createtime').html(formatDate(rowData.createtime));
            $('#checktime').html(formatDate(rowData.checktime));
            $('#starttime').html(formatDate(rowData.starttime));
            $('#endtime').html(formatDate(rowData.endtime));
            //打开窗口
            $('#ordersDlg').dialog('open');
            //加载明细表格
            $('#itemgrid').datagrid('loadData', rowData.orderdetails);
        }
    });

    //明细表格
    $('#itemgrid').datagrid({
        columns: [[
            {field: 'uuid', title: '编号', width: 100},
            {field: 'goodsuuid', title: '商品编号', width: 100},
            {field: 'goodsname', title: '商品名称', width: 100},
            {field: 'price', title: '价格', width: 100},
            {field: 'num', title: '数量', width: 100},
            {field: 'money', title: '金额', width: 100},
            {field: 'state', title: '状态', width: 100, formatter: getDetailState}
        ]],
        fitColumns: true,
        singleSelect: true
    });

    //添加审核按钮
    if (Request['oper'] == 'doCheck') {
        $('#ordersDlg').dialog({
            toolbar: [{
                text: '审核',
                iconCls: 'icon-search',
                handler: doCheck
            }]
        })
    }
    //添加确认按钮
    if (Request['oper'] == 'doStart') {
        $('#ordersDlg').dialog({
            toolbar: [{
                text: '确认',
                iconCls: 'icon-search',
                handler: doStart
            }]
        })
    }
    //添加明细表格双击事件
    if (Request['oper'] == 'doInStore') {
        $('#itemgrid').datagrid({
            onDblClickRow:function (rowIndex, rowData) {
                //打开窗口
                $('#itemDlg').dialog('open');
                //给弹窗设置值
                $('#itemuuid').val(rowData.uuid);
                $('#goodsuuid').html(rowData.goodsuuid);
                $('#goodsname').html(rowData.goodsname);
                $('#goodsnum').html(rowData.num);
            }
        });
    }
    //初始化入库弹窗
    $('#itemDlg').dialog({
        title: '入库',
        width: 400,
        height: 200,
        closed: true,
        modal: true,
        buttons:[{
            text:'入库',
            iconCls:'icon-save',
            handler:doInStore
        }]
    });
});

function formatDate(value) {
    return new Date(value).Format('yyyy-MM-dd');
}

function getState(value) {
    switch (value * 1) {
        case 0:
            return '未审核';
        case 1:
            return '已审核';
        case 2:
            return '已确认';
        case 3:
            return '已入库';
        default :
            return '';
    }
}

function getDetailState(value) {
    switch (value * 1) {
        case 0:
            return '未入库';
        case 1:
            return '已入库';
        default :
            return '';
    }
}

/**
 * 审核发方
 */
function doCheck() {
    $.messager.confirm('确认', '确认要审核吗？', function (flag) {
        if (flag) {
            $.ajax({
                url: 'orders_doCheck?id=' + $('#uuid').html(),
                dataType: 'json',
                type: 'post',
                success: function (data) {
                    $.messager.alert('提示', data.message, 'info', function () {
                        //关闭弹窗
                        $('#ordersDlg').dialog('close');
                        //重新订单列表加载数据
                        $('#grid').datagrid('reload');
                    })
                }
            });
        }
    });
}

/**
 * 确认方法
 */
function doStart() {
    $.messager.confirm('确认', '确认要确认订单吗？', function (flag) {
        if (flag) {
            $.ajax({
                url: 'orders_doStart?id=' + $('#uuid').html(),
                dataType: 'json',
                type: 'post',
                success: function (data) {
                    $.messager.alert('提示', data.message, 'info', function () {
                        if (data.success) {
                            //关闭窗口
                            $('#ordersDlg').dialog('close');
                            //刷新订单列表数据
                            $('#grid').datagrid('reload');
                        }
                    })
                }
            });
        }
    });
}

/**
 * 入库方法
 */
function doInStore() {
    var formData = $('#itemForm').serializeJSON();
    if (formData.storeuuid == null || formData.storeuuid == "") {
        $.messager.alert('提示','请选择仓库','info');
        return;
    }
    //询问用户是否入库
    $.messager.confirm('确认对话框', '您确认要确认吗？', function(flag){
        if (flag){
            $.ajax({
                url:'orderdetail_doInStore',
                dataType:'json',
                data:formData,
                type:'post',
                success:function (data) {
                    if (data.success) {
                        $.messager.alert('提示',data.message,'info',function () {
                            //关闭窗口
                            $('#itemDlg').dialog('close');
                            //修改明细状态为已入库
                            $('#itemgrid').datagrid('getSelected').state = 1;
                            //刷新明细列表更新明细状态
                            var itemData = $('#itemgrid').datagrid('getData');
                            //重新加载
                            $('#itemgrid').datagrid('loadData',itemData);

                            //判断是否所有明细都已经入库
                            var storeFlag = true;
                            $.each(itemData.rows,function (index, element) {
                                if (element.state * 0 == 0) {
                                    storeFlag = false;
                                    return false;
                                }
                            });
                            if (storeFlag) {
                                //关闭明细弹窗
                                $('#ordersDlg').dialog('close');
                                //刷新订单列表
                                $('#grid').datagrid('reload');
                            }
                        });
                    }else {
                        $.messager.alert('提示',data.message,'info');
                    }
                }
            });
        }
    });
}