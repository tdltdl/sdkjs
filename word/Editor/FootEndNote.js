/*
 * (c) Copyright Ascensio System SIA 2010-2024
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";

var footnote_ContinuationNotice  = 0;
var footnote_ContinuationSeparator   = 1;
var footnote_Normal = 2;
var footnote_Separator   = 3;

/**
 * Класс представляющий сноску в документе.
 * @param {CDocumentControllerBase} DocumentController
 * @constructor
 * @extends {CDocumentContent}
 */
function CFootEndnote(DocumentController)
{
	CDocumentContent.call(this, DocumentController, DocumentController ? DocumentController.Get_DrawingDocument() : undefined, 0, 0, 0, 0, true, false, false);

	this.Number            = 1;
	this.SectPr            = null;
	this.CurtomMarkFollows = false;
	this.NeedUpdateHint    = true;
	this.Hint              = "";
	this.SectionIndex      = -1; // Номер секции, к которой относится данная сноска (нужно для концевых сносок)
	this.Ref               = null; // Связанная с данной сноской ссылка

	this.PositionInfo     = {
		Paragraph : null,
		Run       : null,
		Line      : 0,
		Range     : 0,
		X         : 0,
		W         : 0
	};
}

CFootEndnote.prototype = Object.create(CDocumentContent.prototype);
CFootEndnote.prototype.constructor = CFootEndnote;

CFootEndnote.prototype.Copy = function(oDocumentController)
{
	var oNote = new CFootEndnote(oDocumentController);
	oNote.Copy2(this);
	return oNote;
};
CFootEndnote.prototype.GetElementPageIndex = function(nPageAbs, nColumnAbs)
{
	// Функция аналогична Document.private_GetElementPageIndex
	var nStartPage    = this.StartPage;
	var nStartColumn  = this.StartColumn;
	var nColumnsCount = this.ColumnsCount;

	return Math.max(0, nColumnAbs - nStartColumn + (nPageAbs - nStartPage) * nColumnsCount);
};
CFootEndnote.prototype.Get_PageContentStartPos = function(nCurPage)
{
	var nPageAbs   = this.Get_AbsolutePage(nCurPage);
	var nColumnAbs = this.Get_AbsoluteColumn(nCurPage);
	return this.Parent.Get_PageContentStartPos(nPageAbs, nColumnAbs, this.GetSectionIndex());
};
CFootEndnote.prototype.Refresh_RecalcData2 = function(nIndex, nCurPage)
{
	this.Parent.Refresh_RecalcData2(this.Get_AbsolutePage(nCurPage));
};
CFootEndnote.prototype.Write_ToBinary2 = function(Writer)
{
	Writer.WriteLong(AscDFH.historyitem_type_FootEndNote);
	CDocumentContent.prototype.Write_ToBinary2.call(this, Writer);
};
CFootEndnote.prototype.Read_FromBinary2 = function(Reader)
{
	Reader.GetLong(); // Должен вернуть historyitem_type_DocumentContent
	CDocumentContent.prototype.Read_FromBinary2.call(this, Reader);
};
CFootEndnote.prototype.SetNumber = function(nNumber, oSectPr, bCustomMarkFollows)
{
	this.Number            = nNumber;
	this.SectPr            = oSectPr;
	this.CurtomMarkFollows = bCustomMarkFollows;
};
CFootEndnote.prototype.GetNumber = function()
{
	return this.Number;
};
CFootEndnote.prototype.GetReferenceSectPr = function()
{
	return this.SectPr;
};
CFootEndnote.prototype.IsCustomMarkFollows = function()
{
	return this.CurtomMarkFollows;
};
CFootEndnote.prototype.AddDefaultFootnoteContent = function(sText)
{
	var oStyles    = this.LogicDocument.GetStyles();
	var oParagraph = this.GetFirstParagraph();

	oParagraph.Style_Add(oStyles.GetDefaultFootnoteText());
	var oRun = new ParaRun(oParagraph, false);
	oRun.SetRStyle(oStyles.GetDefaultFootnoteReference());
	if (sText)
		oRun.AddText(sText);
	else
		oRun.AddToContent(0, new AscWord.CRunFootnoteRef(this));

	oParagraph.AddToContent(0, oRun);
	oRun = new ParaRun(oParagraph, false);
	oRun.AddToContent(0, new AscWord.CRunSpace());
	oParagraph.AddToContent(1, oRun);

	this.MoveCursorToEndPos(false);
};
CFootEndnote.prototype.AddDefaultEndnoteContent = function(sText)
{
	var oStyles    = this.LogicDocument.GetStyles();
	var oParagraph = this.GetFirstParagraph();

	oParagraph.Style_Add(oStyles.GetDefaultEndnoteText());
	var oRun = new ParaRun(oParagraph, false);
	oRun.SetRStyle(oStyles.GetDefaultEndnoteReference());
	if (sText)
		oRun.AddText(sText);
	else
		oRun.AddToContent(0, new AscWord.CRunEndnoteRef(this));

	oParagraph.AddToContent(0, oRun);
	oRun = new ParaRun(oParagraph, false);
	oRun.AddToContent(0, new AscWord.CRunSpace());
	oParagraph.AddToContent(1, oRun);

	this.MoveCursorToEndPos(false);
};
CFootEndnote.prototype.Recalculate_Page = function(PageIndex, bStart)
{
	this.NeedUpdateHint = true;
	return CDocumentContent.prototype.Recalculate_Page.call(this, PageIndex, bStart);
};
CFootEndnote.prototype.GetHint = function()
{
	if (true === this.NeedUpdateHint)
	{
		var arrParagraphs = this.GetAllParagraphs({All : true});
		this.Hint         = "";
		for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
		{
			this.Hint += arrParagraphs[nIndex].GetText();
		}

		this.NeedUpdateHint = false;
	}

	return this.Hint;
};
CFootEndnote.prototype.UpdatePositionInfo = function(Paragraph, Run, Line, Range, X, W)
{
	this.PositionInfo.Paragraph = Paragraph;
	this.PositionInfo.Run       = Run;
	this.PositionInfo.Line      = Line;
	this.PositionInfo.Range     = Range;
	this.PositionInfo.X         = X;
	this.PositionInfo.W         = W;
};
CFootEndnote.prototype.GetPositionInfo = function()
{
	return this.PositionInfo;
};
CFootEndnote.prototype.OnFastRecalculate = function()
{
	this.NeedUpdateHint = true;
};
CFootEndnote.prototype.Get_ColumnFields = function(nElementIndex, nColumnIndex)
{
	return this.Parent.GetColumnFields(this.Get_StartPage_Absolute(), nColumnIndex, this.GetSectionIndex());
};
CFootEndnote.prototype.SetSectionIndex = function(nSectionIndex)
{
	this.SectionIndex = nSectionIndex;
};
CFootEndnote.prototype.GetSectionIndex = function(nSectionIndex)
{
	return this.SectionIndex;
};
CFootEndnote.prototype.PrepareRecalculateObject = function()
{
	CDocumentContent.prototype.PrepareRecalculateObject.call(this);
};
CFootEndnote.prototype.SaveRecalculateObject = function()
{
	return {
		SectionIndex : this.SectionIndex,
		DocContent   : CDocumentContent.prototype.SaveRecalculateObject.call(this)
	};
};
CFootEndnote.prototype.LoadRecalculateObject = function(oRecalcObj)
{
	this.SectionIndex = oRecalcObj.SectionIndex;
	CDocumentContent.prototype.LoadRecalculateObject.call(this, oRecalcObj.DocContent);
};
/**
 * Конвертируем содержимое сноски из концевой в обычную, или ноборот
 * @param isToFootnote {boolean}
 */
CFootEndnote.prototype.ConvertFootnoteType = function(isToFootnote)
{
	if (!this.LogicDocument)
		return;

	var oStyles   = this.LogicDocument.GetStyles();
	var oFootnote = this;

	var arrParagraphs = this.GetAllParagraphs();

	var sSrcStyle, sDstStyle;
	if (isToFootnote)
	{
		sSrcStyle = oStyles.GetDefaultEndnoteText();
		sDstStyle = oStyles.GetDefaultFootnoteText();
	}
	else
	{
		sSrcStyle = oStyles.GetDefaultFootnoteText();
		sDstStyle = oStyles.GetDefaultEndnoteText();
	}

	for (var nIndex = 0, nCount = arrParagraphs.length; nIndex < nCount; ++nIndex)
	{
		var oParagraph = arrParagraphs[nIndex];
		if (oParagraph.Style_Get() === sSrcStyle)
			oParagraph.Style_Add(sDstStyle, true);

		oParagraph.CheckRunContent(function(oRun)
		{
			oRun.ConvertFootnoteType(isToFootnote, oStyles, oFootnote);
		});
	}
};
CFootEndnote.prototype.SetRef = function(oRef)
{
	if (oRef && (oRef instanceof AscWord.CRunFootnoteReference || oRef instanceof AscWord.CRunEndnoteReference))
		this.Ref = oRef;
};
CFootEndnote.prototype.GetRef = function()
{
	return this.Ref;
};
CFootEndnote.prototype.IsInPermRange = function()
{
	return this.Ref ? this.Ref.IsInPermRange() : false;
};

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CFootEndnote = CFootEndnote;
window['AscWord'].FootEndnote = CFootEndnote;
