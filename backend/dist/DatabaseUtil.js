"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var postgres_1 = require("postgres");
console.log(process.env.HOST);
var sql = (0, postgres_1.default)("postgres://".concat(process.env.USER, ":").concat(process.env.PASS, "@").concat(process.env.HOST, ":").concat(parseInt(process.env.PORT, 10) || 5432, "/").concat(process.env.DB));
var testQuery = await sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\nSELECT * FROM students;"], ["\nSELECT * FROM students;"])));
var templateObject_1;
